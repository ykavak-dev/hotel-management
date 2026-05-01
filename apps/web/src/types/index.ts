export type UserRole = 'customer' | 'hotel_owner' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
}

export interface ApiError {
  status: string;
  message: string;
  errors?: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

export * from './hotel';
// booking.ts exports BookingDetail, CreateBookingData, CancellationResult which conflict with hotel.ts
// Import directly from booking.ts for PaymentDetail
export type { PaymentDetail } from './booking';
export * from './admin';
