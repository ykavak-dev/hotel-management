import { prisma } from '../utils/db';
import { ApiError } from '../utils/ApiError';
import type { RoomType } from '../../generated/prisma';

export interface SearchParams {
  location?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  starRating?: number;
  roomType?: RoomType;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'relevance';
  page: number;
  limit: number;
}

export interface HotelSearchResult {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  starRating: number | null;
  amenities: string[];
  images: string[];
  averageRating: number | null;
  totalReviews: number;
  cheapestRoomPrice: number;
  availableRoomTypes: string[];
}

export interface SearchResult {
  hotels: HotelSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

interface AvailabilityInfo {
  roomId: string;
  hotelId: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  totalQuantity: number;
  bookedCount: number;
  availableQuantity: number;
}

function parseDate(dateStr: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new ApiError('Invalid date format', 400, 'VALIDATION_ERROR');
  }
  return date;
}

async function getRoomAvailability(
  roomIds: string[],
  checkIn: Date,
  checkOut: Date,
): Promise<Map<string, number>> {
  if (roomIds.length === 0) return new Map();

  const overlapping = await prisma.booking.groupBy({
    by: ['roomId'],
    where: {
      roomId: { in: roomIds },
      status: { notIn: ['CANCELLED'] },
      AND: [
        { checkIn: { lt: checkOut } },
        { checkOut: { gt: checkIn } },
      ],
    },
    _count: { _all: true },
  });

  return new Map(overlapping.map((o) => [o.roomId, o._count._all]));
}

export async function searchHotels(params: SearchParams): Promise<SearchResult> {
  const checkIn = parseDate(params.checkIn);
  const checkOut = parseDate(params.checkOut);

  if (checkOut <= checkIn) {
    throw new ApiError('Check-out date must be after check-in date', 400, 'VALIDATION_ERROR');
  }

  // 1. Build hotel base filter
  const hotelWhere = {
    isVerified: true,
    ...(params.location && {
      OR: [
        { name: { contains: params.location, mode: 'insensitive' as const } },
        { city: { contains: params.location, mode: 'insensitive' as const } },
        { country: { contains: params.location, mode: 'insensitive' as const } },
      ],
    }),
    ...(params.starRating !== undefined && { starRating: { gte: params.starRating } }),
    ...(params.amenities && params.amenities.length > 0 && {
      amenities: { hasEvery: params.amenities },
    }),
  };

  // 2. Get matching hotel IDs
  const matchingHotels = await prisma.hotel.findMany({
    where: hotelWhere,
    select: { id: true },
  });

  const hotelIds = matchingHotels.map((h) => h.id);

  if (hotelIds.length === 0) {
    return {
      hotels: [],
      total: 0,
      page: params.page,
      limit: params.limit,
      totalPages: 0,
      hasNextPage: false,
    };
  }

  // 3. Get candidate rooms
  const rooms = await prisma.room.findMany({
    where: {
      hotelId: { in: hotelIds },
      isActive: true,
      capacity: { gte: params.guests },
      ...(params.minPrice !== undefined && { pricePerNight: { gte: params.minPrice } }),
      ...(params.maxPrice !== undefined && { pricePerNight: { lte: params.maxPrice } }),
      ...(params.roomType && { type: params.roomType }),
    },
    select: {
      id: true,
      hotelId: true,
      type: true,
      pricePerNight: true,
      capacity: true,
      totalQuantity: true,
    },
  });

  if (rooms.length === 0) {
    return {
      hotels: [],
      total: 0,
      page: params.page,
      limit: params.limit,
      totalPages: 0,
      hasNextPage: false,
    };
  }

  // 4. Check availability
  const roomIds = rooms.map((r) => r.id);
  const overlapMap = await getRoomAvailability(roomIds, checkIn, checkOut);

  const availableRooms: AvailabilityInfo[] = [];
  for (const room of rooms) {
    const booked = overlapMap.get(room.id) || 0;
    const availableQty = room.totalQuantity - booked;
    if (availableQty >= 1) {
      availableRooms.push({
        roomId: room.id,
        hotelId: room.hotelId,
        type: room.type,
        pricePerNight: Number(room.pricePerNight),
        capacity: room.capacity,
        totalQuantity: room.totalQuantity,
        bookedCount: booked,
        availableQuantity: availableQty,
      });
    }
  }

  if (availableRooms.length === 0) {
    return {
      hotels: [],
      total: 0,
      page: params.page,
      limit: params.limit,
      totalPages: 0,
      hasNextPage: false,
    };
  }

  // 5. Group by hotel and compute cheapest price + room types
  const hotelRoomMap = new Map<string, { cheapestPrice: number; roomTypes: Set<string> }>();

  for (const room of availableRooms) {
    const existing = hotelRoomMap.get(room.hotelId);
    if (!existing) {
      hotelRoomMap.set(room.hotelId, {
        cheapestPrice: room.pricePerNight,
        roomTypes: new Set([room.type]),
      });
    } else {
      if (room.pricePerNight < existing.cheapestPrice) {
        existing.cheapestPrice = room.pricePerNight;
      }
      existing.roomTypes.add(room.type);
    }
  }

  // 6. Fetch full hotel data with ratings for the hotels with availability
  const availableHotelIds = Array.from(hotelRoomMap.keys());

  const hotelsWithRating = await prisma.hotel.findMany({
    where: { id: { in: availableHotelIds } },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      city: true,
      country: true,
      starRating: true,
      amenities: true,
      images: true,
    },
  });

  const reviewAggregates = await prisma.review.groupBy({
    by: ['hotelId'],
    where: { hotelId: { in: availableHotelIds }, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const ratingMap = new Map(
    reviewAggregates.map((r) => [
      r.hotelId,
      {
        average: r._avg.rating ? Number(r._avg.rating.toFixed(2)) : null,
        count: r._count._all,
      },
    ]),
  );

  // 7. Build result array
  let results: HotelSearchResult[] = hotelsWithRating.map((h) => {
    const roomInfo = hotelRoomMap.get(h.id)!;
    const rating = ratingMap.get(h.id);
    return {
      ...h,
      averageRating: rating?.average ?? null,
      totalReviews: rating?.count ?? 0,
      cheapestRoomPrice: roomInfo.cheapestPrice,
      availableRoomTypes: Array.from(roomInfo.roomTypes),
    };
  });

  // 8. Sort
  const sortBy = params.sortBy ?? 'relevance';
  switch (sortBy) {
    case 'price_asc':
      results.sort((a, b) => a.cheapestRoomPrice - b.cheapestRoomPrice);
      break;
    case 'price_desc':
      results.sort((a, b) => b.cheapestRoomPrice - a.cheapestRoomPrice);
      break;
    case 'rating_desc':
      results.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
      break;
    case 'relevance':
    default: {
      const locLower = params.location?.toLowerCase() ?? '';
      results.sort((a, b) => {
        let scoreA = (a.averageRating ?? 0) * 10;
        let scoreB = (b.averageRating ?? 0) * 10;
        if (locLower) {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          if (aName.includes(locLower)) scoreA += 50;
          if (bName.includes(locLower)) scoreB += 50;
          if (aName.startsWith(locLower)) scoreA += 25;
          if (bName.startsWith(locLower)) scoreB += 25;
        }
        return scoreB - scoreA;
      });
      break;
    }
  }

  // 9. Paginate
  const total = results.length;
  const start = (params.page - 1) * params.limit;
  const paginated = results.slice(start, start + params.limit);

  return {
    hotels: paginated,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
    hasNextPage: start + params.limit < total,
  };
}

export interface AvailabilityResult {
  hotelId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  availableRooms: Array<{
    id: string;
    type: string;
    description: string | null;
    pricePerNight: number;
    capacity: number;
    bedType: string | null;
    roomSize: number | null;
    amenities: string[];
    images: string[];
    totalQuantity: number;
    availableQuantity: number;
  }>;
}

export async function checkHotelAvailability(
  hotelId: string,
  checkInStr: string,
  checkOutStr: string,
  guests: number,
): Promise<AvailabilityResult> {
  const checkIn = parseDate(checkInStr);
  const checkOut = parseDate(checkOutStr);

  if (checkOut <= checkIn) {
    throw new ApiError('Check-out date must be after check-in date', 400, 'VALIDATION_ERROR');
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true, name: true },
  });

  if (!hotel) {
    throw new ApiError('Hotel not found', 404, 'NOT_FOUND');
  }

  const rooms = await prisma.room.findMany({
    where: {
      hotelId,
      isActive: true,
      capacity: { gte: guests },
    },
  });

  if (rooms.length === 0) {
    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      guests,
      availableRooms: [],
    };
  }

  const roomIds = rooms.map((r) => r.id);
  const overlapMap = await getRoomAvailability(roomIds, checkIn, checkOut);

  const availableRooms = rooms
    .map((room) => {
      const booked = overlapMap.get(room.id) || 0;
      const availableQty = room.totalQuantity - booked;
      return {
        id: room.id,
        type: room.type,
        description: room.description,
        pricePerNight: Number(room.pricePerNight),
        capacity: room.capacity,
        bedType: room.bedType,
        roomSize: room.roomSize,
        amenities: room.amenities,
        images: room.images,
        totalQuantity: room.totalQuantity,
        availableQuantity: availableQty,
      };
    })
    .filter((r) => r.availableQuantity >= 1);

  return {
    hotelId: hotel.id,
    hotelName: hotel.name,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    guests,
    availableRooms,
  };
}
