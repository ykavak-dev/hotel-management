import { prisma } from '../utils/db';
import { ApiError } from '../utils/ApiError';
import type { BookingStatus } from '../../generated/prisma';
import { sendBookingConfirmationEmail, sendBookingCancellationEmail, sendCheckInReminderEmail } from './email.service';

export interface CreateBookingData {
  userId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  specialRequests?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DecimalCompatible = any;

export interface BookingDetail {
  id: string;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  specialRequests: string | null;
  createdAt: Date;
  room: {
    id: string;
    type: string;
    description: string | null;
    pricePerNight: number;
    capacity: number;
    bedType: string | null;
    amenities: string[];
    images: string[];
    hotel: {
      id: string;
      name: string;
      address: string;
      city: string;
      country: string;
      starRating: number | null;
      amenities: string[];
      images: string[];
    };
  };
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
    transactionId: string | null;
    paidAt: Date | null;
    createdAt: Date;
  }>;
}

function normalizeBooking(booking: DecimalCompatible): BookingDetail {
  return {
    ...booking,
    totalPrice: Number(booking.totalPrice),
    room: {
      ...booking.room,
      pricePerNight: Number(booking.room.pricePerNight),
    },
  };
}

function calculateNights(checkIn: Date, checkOut: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay);
}

export async function createBooking(data: CreateBookingData): Promise<BookingDetail> {
  const { userId, roomId, checkIn, checkOut, numberOfGuests, specialRequests } = data;

  // 1. Validate dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  if (checkIn < tomorrow) {
    throw new ApiError('Check-in date must be at least tomorrow', 400, 'VALIDATION_ERROR');
  }

  if (checkOut <= checkIn) {
    throw new ApiError('Check-out date must be after check-in date', 400, 'VALIDATION_ERROR');
  }

  // 2. Get room with hotel info
  const room = await prisma.room.findUnique({
    where: { id: roomId, isActive: true },
    include: { hotel: { select: { id: true, name: true, isVerified: true } } },
  });

  if (!room) {
    throw new ApiError('Room not found or inactive', 404, 'NOT_FOUND');
  }

  if (!room.hotel.isVerified) {
    throw new ApiError('Hotel is not verified', 400, 'HOTEL_NOT_VERIFIED');
  }

  // 3. Check guest capacity
  if (room.capacity < numberOfGuests) {
    throw new ApiError(`Room capacity (${room.capacity}) is less than requested guests (${numberOfGuests})`, 400, 'CAPACITY_EXCEEDED');
  }

  // 4. Check availability (overbooking prevention with transaction)
  const nights = calculateNights(checkIn, checkOut);

  return prisma.$transaction(async (tx) => {
    const overlapping = await tx.booking.findMany({
      where: {
        roomId,
        status: { notIn: ['CANCELLED'] },
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
        ],
      },
    });

    const bookedCount = overlapping.length;
    if (room.totalQuantity - bookedCount < 1) {
      throw new ApiError('No rooms available for the selected dates', 409, 'NO_AVAILABILITY');
    }

    const totalPrice = Number(room.pricePerNight) * nights;

    const booking = await tx.booking.create({
      data: {
        userId,
        roomId,
        checkIn,
        checkOut,
        numberOfGuests,
        totalPrice,
        status: 'PENDING',
        specialRequests: specialRequests ?? null,
      },
      include: {
        room: {
          include: { hotel: true },
        },
        payments: true,
      },
    });

    return normalizeBooking(booking);
  }, {
    isolationLevel: 'Serializable',
  });
}

export async function getUserBookings(userId: string): Promise<BookingDetail[]> {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      room: {
        include: { hotel: true },
      },
      payments: true,
    },
  });

  return bookings.map(normalizeBooking);
}

export async function getBookingById(bookingId: string, userId: string): Promise<BookingDetail> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: {
        include: { hotel: true },
      },
      payments: true,
    },
  });

  if (!booking) {
    throw new ApiError('Booking not found', 404, 'NOT_FOUND');
  }

  // Allow access if user owns the booking or is hotel admin for that hotel
  if (booking.userId !== userId) {
    const hotelAdmin = await prisma.hotelOwner.findFirst({
      where: {
        userId,
        hotelId: booking.room.hotelId,
      },
    });
    if (!hotelAdmin) {
      throw new ApiError('Access denied', 403, 'FORBIDDEN');
    }
  }

  return normalizeBooking(booking);
}

export async function cancelBooking(bookingId: string, userId: string): Promise<{
  booking: BookingDetail;
  refundAmount: number;
  refundPolicy: string;
}> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: { include: { hotel: true } },
      payments: true,
    },
  });

  if (!booking) {
    throw new ApiError('Booking not found', 404, 'NOT_FOUND');
  }

  if (booking.userId !== userId) {
    throw new ApiError('Access denied', 403, 'FORBIDDEN');
  }

  if (booking.status === 'CANCELLED') {
    throw new ApiError('Booking is already cancelled', 400, 'ALREADY_CANCELLED');
  }

  if (booking.status === 'COMPLETED') {
    throw new ApiError('Cannot cancel a completed booking', 400, 'CANNOT_CANCEL');
  }

  // Calculate refund
  const now = new Date();
  const checkInTime = booking.checkIn.getTime();
  const hoursUntilCheckIn = (checkInTime - now.getTime()) / (1000 * 60 * 60);

  let refundAmount = 0;
  let refundPolicy = '';

  if (hoursUntilCheckIn >= 48) {
    refundAmount = Number(booking.totalPrice);
    refundPolicy = 'full refund (48+ hours before check-in)';
  } else if (hoursUntilCheckIn >= 24) {
    refundAmount = Number(booking.totalPrice) * 0.5;
    refundPolicy = '50% refund (24-48 hours before check-in)';
  } else {
    refundAmount = 0;
    refundPolicy = 'no refund (<24 hours before check-in)';
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: {
        room: { include: { hotel: true } },
        payments: true,
      },
    });

    // Process refunds for any PAID payments
    const paidPayments = cancelled.payments.filter((p) => p.status === 'PAID');
    for (const payment of paidPayments) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });
    }

    return cancelled;
  });

  sendBookingCancellationEmail(booking, refundAmount, refundPolicy);

  return {
    booking: normalizeBooking(updated),
    refundAmount,
    refundPolicy,
  };
}

export async function getHotelAdminBookings(hotelAdminId: string, page: number, limit: number) {
  // Get hotels owned by this admin
  const ownedHotels = await prisma.hotelOwner.findMany({
    where: { userId: hotelAdminId },
    select: { hotelId: true },
  });

  const hotelIds = ownedHotels.map((h) => h.hotelId);

  if (hotelIds.length === 0) {
    return { bookings: [], total: 0, page, totalPages: 0 };
  }

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { room: { hotelId: { in: hotelIds } } },
      include: {
        room: { include: { hotel: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({
      where: { room: { hotelId: { in: hotelIds } } },
    }),
  ]);

  return {
    bookings: bookings.map(normalizeBooking),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function confirmBooking(bookingId: string, hotelAdminId: string): Promise<BookingDetail> {
  // Verify ownership
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: { include: { hotel: true } } },
  });

  if (!booking) {
    throw new ApiError('Booking not found', 404, 'NOT_FOUND');
  }

  const isOwner = await prisma.hotelOwner.findFirst({
    where: { userId: hotelAdminId, hotelId: booking.room.hotelId },
  });

  if (!isOwner) {
    throw new ApiError('Access denied', 403, 'FORBIDDEN');
  }

  if (booking.status !== 'PENDING') {
    throw new ApiError('Only PENDING bookings can be confirmed', 400, 'INVALID_STATUS');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED' },
    include: {
      room: { include: { hotel: true } },
      payments: true,
    },
  });

  sendBookingConfirmationEmail(updated);

  return normalizeBooking(updated);
}

export async function checkInBooking(bookingId: string, hotelAdminId: string): Promise<BookingDetail> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: { include: { hotel: true } } },
  });

  if (!booking) {
    throw new ApiError('Booking not found', 404, 'NOT_FOUND');
  }

  const isOwner = await prisma.hotelOwner.findFirst({
    where: { userId: hotelAdminId, hotelId: booking.room.hotelId },
  });

  if (!isOwner) {
    throw new ApiError('Access denied', 403, 'FORBIDDEN');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new ApiError('Only CONFIRMED bookings can be checked in', 400, 'INVALID_STATUS');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'COMPLETED' },
    include: {
      room: { include: { hotel: true } },
      payments: true,
    },
  });

  sendCheckInReminderEmail(updated);

  return normalizeBooking(updated);
}

export async function checkOutBooking(bookingId: string, hotelAdminId: string): Promise<BookingDetail> {
  return checkInBooking(bookingId, hotelAdminId);
}
