import { prisma } from '../utils/db';
import { ApiError } from '../utils/ApiError';

export interface HotelListItem {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  starRating: number | null;
  amenities: string[];
  images: string[];
  isVerified: boolean;
  createdAt: Date;
  _count?: { reviews: number };
}

export interface HotelDetail extends HotelListItem {
  rooms: Array<{
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
  }>;
  averageRating: number | null;
  totalReviews: number;
}

export async function listVerifiedHotels(page: number, limit: number): Promise<{
  hotels: HotelListItem[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const skip = (page - 1) * limit;

  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({
      where: { isVerified: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true,
        starRating: true,
        amenities: true,
        images: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { reviews: true } },
      },
    }),
    prisma.hotel.count({ where: { isVerified: true } }),
  ]);

  return {
    hotels,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getHotelDetail(hotelId: string): Promise<HotelDetail> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId, isVerified: true },
    include: {
      rooms: {
        where: { isActive: true },
        select: {
          id: true,
          type: true,
          description: true,
          pricePerNight: true,
          capacity: true,
          bedType: true,
          roomSize: true,
          amenities: true,
          images: true,
          totalQuantity: true,
        },
      },
    },
  });

  if (!hotel) {
    throw new ApiError('Hotel not found', 404, 'NOT_FOUND');
  }

  const aggregate = await prisma.review.aggregate({
    where: { hotelId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return {
    ...hotel,
    rooms: hotel.rooms.map((r) => ({
      ...r,
      pricePerNight: Number(r.pricePerNight),
    })),
    averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : null,
    totalReviews: aggregate._count._all,
  };
}

export async function createHotel(data: {
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  amenities?: string[];
  images?: string[];
  ownerId: string;
}): Promise<HotelListItem> {
  const hotel = await prisma.hotel.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      address: data.address,
      city: data.city,
      country: data.country,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      starRating: data.starRating ?? null,
      amenities: data.amenities ?? [],
      images: data.images ?? [],
      ownerId: data.ownerId,
      isVerified: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      starRating: true,
      amenities: true,
      images: true,
      isVerified: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });

  return hotel;
}

export async function updateHotel(
  hotelId: string,
  data: {
    name?: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    starRating?: number;
    amenities?: string[];
    images?: string[];
  },
): Promise<HotelListItem> {
  const hotel = await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.latitude !== undefined && { latitude: data.latitude ?? null }),
      ...(data.longitude !== undefined && { longitude: data.longitude ?? null }),
      ...(data.starRating !== undefined && { starRating: data.starRating ?? null }),
      ...(data.amenities !== undefined && { amenities: data.amenities }),
      ...(data.images !== undefined && { images: data.images }),
    },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      starRating: true,
      amenities: true,
      images: true,
      isVerified: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });

  return hotel;
}

export async function getMyHotels(ownerId: string): Promise<HotelListItem[]> {
  return prisma.hotel.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      starRating: true,
      amenities: true,
      images: true,
      isVerified: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });
}

export async function verifyHotel(hotelId: string): Promise<HotelListItem> {
  const hotel = await prisma.hotel.update({
    where: { id: hotelId },
    data: { isVerified: true, rejectionReason: null },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      starRating: true,
      amenities: true,
      images: true,
      isVerified: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });

  return hotel;
}

export async function rejectHotel(hotelId: string, reason: string): Promise<HotelListItem> {
  const hotel = await prisma.hotel.update({
    where: { id: hotelId },
    data: { isVerified: false, rejectionReason: reason },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      starRating: true,
      amenities: true,
      images: true,
      isVerified: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });

  return hotel;
}
