export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  HOTEL_ADMIN = 'HOTEL_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  SUITE = 'SUITE',
  DELUXE = 'DELUXE',
  FAMILY = 'FAMILY',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum HotelOwnerRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hotel {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  starRating?: number | null;
  amenities: string[];
  images: string[];
  isVerified: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  hotelId: string;
  type: RoomType;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  bedType?: string | null;
  roomSize?: number | null;
  amenities: string[];
  images: string[];
  totalQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  numberOfGuests: number;
  totalPrice: number;
  status: BookingStatus;
  specialRequests?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  hotelId: string;
  bookingId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
}

export interface HotelOwner {
  id: string;
  userId: string;
  hotelId: string;
  role: HotelOwnerRole;
  createdAt: Date;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown> | null;
  createdAt: Date;
}
