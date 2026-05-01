import { z } from 'zod';
import {
  UserRole,
  RoomType,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  HotelOwnerRole,
} from './types';

export const UserRoleSchema = z.nativeEnum(UserRole);
export const RoomTypeSchema = z.nativeEnum(RoomType);
export const BookingStatusSchema = z.nativeEnum(BookingStatus);
export const PaymentMethodSchema = z.nativeEnum(PaymentMethod);
export const PaymentStatusSchema = z.nativeEnum(PaymentStatus);
export const HotelOwnerRoleSchema = z.nativeEnum(HotelOwnerRole);

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  role: UserRoleSchema.default(UserRole.CUSTOMER),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const createHotelSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  address: z.string().min(1).max(300),
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  starRating: z.number().int().min(1).max(5).optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
});

export const updateHotelSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().min(1).max(300).optional(),
  city: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  starRating: z.number().int().min(1).max(5).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
});

export const rejectHotelSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const createRoomSchema = z.object({
  type: RoomTypeSchema,
  description: z.string().max(1000).optional(),
  pricePerNight: z.number().positive(),
  capacity: z.number().int().positive(),
  bedType: z.string().optional(),
  roomSize: z.number().positive().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  totalQuantity: z.number().int().positive().default(1),
});

export const updateRoomSchema = z.object({
  type: RoomTypeSchema.optional(),
  description: z.string().max(1000).optional(),
  pricePerNight: z.number().positive().optional(),
  capacity: z.number().int().positive().optional(),
  bedType: z.string().optional(),
  roomSize: z.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  totalQuantity: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const createBookingSchema = z.object({
  userId: z.string().cuid(),
  roomId: z.string().cuid(),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  numberOfGuests: z.number().int().positive(),
  specialRequests: z.string().max(1000).optional(),
});

export const updateBookingSchema = z.object({
  status: BookingStatusSchema.optional(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  numberOfGuests: z.number().int().positive().optional(),
  specialRequests: z.string().max(1000).optional(),
});

export const createPaymentSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default('USD'),
  paymentMethod: PaymentMethodSchema,
});

export const updatePaymentSchema = z.object({
  status: PaymentStatusSchema.optional(),
  transactionId: z.string().optional(),
  paidAt: z.coerce.date().optional(),
});

export const createReviewSchema = z.object({
  hotelId: z.string().cuid(),
  bookingId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(1).max(2000).optional(),
  isApproved: z.boolean().optional(),
});

export const createHotelOwnerSchema = z.object({
  userId: z.string().cuid(),
  hotelId: z.string().cuid(),
  role: HotelOwnerRoleSchema.default(HotelOwnerRole.OWNER),
});

export const createAdminActivityLogSchema = z.object({
  adminId: z.string().cuid(),
  action: z.string().min(1).max(100),
  entityType: z.string().min(1).max(100),
  entityId: z.string().min(1).max(100),
  details: z.record(z.unknown()).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  role: UserRoleSchema.default(UserRole.CUSTOMER),
  hotelName: z.string().min(1).max(200).optional(),
  hotelAddress: z.string().min(1).max(300).optional(),
  hotelCity: z.string().min(1).max(100).optional(),
  hotelCountry: z.string().min(1).max(100).optional(),
}).refine(
  (data) => {
    if (data.role === UserRole.HOTEL_ADMIN) {
      return !!data.hotelName && !!data.hotelAddress && !!data.hotelCity && !!data.hotelCountry;
    }
    return true;
  },
  {
    message: 'Hotel details are required for HOTEL_ADMIN registration',
    path: ['hotelName'],
  },
);

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
});

export const cuidParamSchema = z.object({
  id: z.string().cuid(),
});
