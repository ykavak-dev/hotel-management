import { prisma } from '../utils/db';
import type { BookingStatus } from '../../generated/prisma';

interface TopHotel {
  id: string;
  name: string;
  bookingCount: number;
  averageRating: number | null;
}

interface DashboardData {
  totalUsers: number;
  totalHotels: number;
  totalBookings: number;
  monthlyRevenue: number;
  pendingVerifications: number;
  recentBookings: Array<{
    id: string;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
    status: BookingStatus;
    createdAt: Date;
    userEmail: string;
    hotelName: string;
    roomType: string;
  }>;
  topHotels: TopHotel[];
}

export async function getDashboard(): Promise<DashboardData> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalHotels,
    totalBookings,
    monthlyRevenueResult,
    pendingVerifications,
    recentBookings,
    hotelBookingCounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.hotel.count(),
    prisma.booking.count(),
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.hotel.count({ where: { isVerified: false } }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { email: true } },
        room: { include: { hotel: { select: { name: true } } } },
      },
    }),
    prisma.booking.groupBy({
      by: ['roomId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  // Get hotel info for top booked rooms
  const roomIds = hotelBookingCounts.map((h) => h.roomId);
  const rooms: any[] = await prisma.room.findMany({
    where: { id: { in: roomIds } },
    include: { hotel: true },
  });
  const roomToHotel = Object.fromEntries(rooms.map((r) => [r.id, r.hotel]));

  const topHotelsMap = new Map<string, TopHotel>();
  for (const hbc of hotelBookingCounts) {
    const hotel = roomToHotel[hbc.roomId];
    if (!hotel) continue;
    const existing = topHotelsMap.get(hotel.id);
    if (existing) {
      existing.bookingCount += hbc._count.id;
      existing.averageRating = (hotel as any).averageRating ?? existing.averageRating;
    } else {
      topHotelsMap.set(hotel.id, {
        id: hotel.id,
        name: hotel.name,
        bookingCount: hbc._count.id,
        averageRating: (hotel as any).averageRating ?? null,
      });
    }
  }

  const topHotels = Array.from(topHotelsMap.values())
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);

  return {
    totalUsers,
    totalHotels,
    totalBookings,
    monthlyRevenue: Number(monthlyRevenueResult._sum.amount) || 0,
    pendingVerifications,
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      totalPrice: Number(b.totalPrice),
      status: b.status,
      createdAt: b.createdAt,
      userEmail: b.user.email,
      hotelName: b.room.hotel.name,
      roomType: b.room.type,
    })),
    topHotels,
  };
}
