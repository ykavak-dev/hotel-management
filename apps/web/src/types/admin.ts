import type { BookingStatus, RoomType } from '@hotel/shared';

export interface AdminDashboardData {
  todaysBookings: number;
  occupancyRate: number;
  monthlyRevenue: number;
  pendingCheckins: number;
  bookingsLast7Days: Array<{ date: string; count: number }>;
  revenueByRoomType: Array<{ roomType: string; revenue: number }>;
  recentBookings: AdminRecentBooking[];
}

export interface AdminRecentBooking {
  id: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Date;
  roomType: string;
  hotelName: string;
  guestEmail: string;
}

export interface BookingFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  roomType?: string;
  guestName?: string;
  page?: number;
  limit?: number;
}

export interface AdminBookingListResponse {
  bookings: AdminBooking[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminBooking {
  id: string;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  specialRequests: string | null;
  createdAt: Date;
  confirmationNumber: string;
  room: {
    id: string;
    type: RoomType;
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
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface RoomManagementItem {
  id: string;
  hotelId: string;
  type: RoomType;
  description: string | null;
  pricePerNight: number;
  capacity: number;
  bedType: string | null;
  roomSize: number | null;
  amenities: string[];
  images: string[];
  totalQuantity: number;
  availableQuantity: number;
}

export interface CreateRoomData {
  type: RoomType;
  description?: string;
  pricePerNight: number;
  capacity: number;
  bedType?: string;
  roomSize?: number;
  amenities?: string[];
  images?: string[];
  totalQuantity: number;
}

export interface UpdateRoomData extends Partial<CreateRoomData> {
  isActive?: boolean;
}

export interface HotelProfileData {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  starRating: number | null;
  amenities: string[];
  images: string[];
  isVerified: boolean;
}

export interface UpdateHotelData {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  starRating?: number;
  amenities?: string[];
  images?: string[];
}
