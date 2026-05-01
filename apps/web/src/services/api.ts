import axios from 'axios';

import type {
  SearchResponse,
  AvailabilityResponse,
  ReviewListResponse,
  ProcessPaymentData,
  PaymentResult,
} from '../types/hotel';

import type {
  CreateBookingData,
  BookingResponse,
  BookingDetail,
  CancellationResult,
} from '../types/booking';

import type { AdminDashboardData, BookingFilters, AdminBookingListResponse, AdminBooking, RoomManagementItem, CreateRoomData, UpdateRoomData, HotelProfileData, UpdateHotelData } from '../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export async function searchHotels(params: Record<string, unknown>): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>('/search/hotels', { params });
  return data;
}

export async function checkAvailability(
  hotelId: string,
  checkIn: string,
  checkOut: string,
  guests: number
): Promise<AvailabilityResponse> {
  const { data } = await api.get<AvailabilityResponse>('/search/availability', {
    params: { hotelId, checkIn, checkOut, guests },
  });
  return data;
}

export async function getHotelReviews(
  hotelId: string,
  page = 1,
  limit = 10
): Promise<ReviewListResponse> {
  const { data } = await api.get<ReviewListResponse>(`/reviews/hotel/${hotelId}`, {
    params: { page, limit },
  });
  return data;
}

export async function canWriteReview(hotelId: string): Promise<{ canReview: boolean; reason?: string }> {
  const { data } = await api.get<{ canReview: boolean; reason?: string }>('/reviews/can-review', {
    params: { hotelId },
  });
  return data;
}

export async function createBooking(data: CreateBookingData): Promise<BookingResponse> {
  const response = await api.post<BookingResponse>('/bookings', data);
  return response.data;
}

export async function getBooking(bookingId: string): Promise<BookingDetail> {
  const { data } = await api.get<BookingDetail>(`/bookings/${bookingId}`);
  return data;
}

export async function cancelBooking(bookingId: string): Promise<CancellationResult> {
  const { data } = await api.put<CancellationResult>(`/bookings/${bookingId}/cancel`);
  return data;
}

export async function getUserBookings(): Promise<BookingDetail[]> {
  const { data } = await api.get<BookingDetail[]>('/bookings');
  return data;
}

export async function processPayment(data: ProcessPaymentData): Promise<PaymentResult> {
  const { data: result } = await api.post<PaymentResult>('/payments/process', data);
  return result;
}

// Admin Dashboard
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await api.get<AdminDashboardData>('/hotel-admin/dashboard');
  return data;
}

// Admin Bookings
export async function getHotelAdminBookings(filters: BookingFilters = {}): Promise<AdminBookingListResponse> {
  const { data } = await api.get<AdminBookingListResponse>('/hotel-admin/bookings', { params: filters });
  return data;
}

export async function confirmBooking(id: string): Promise<AdminBooking> {
  const { data } = await api.put<AdminBooking>(`/hotel-admin/bookings/${id}/confirm`);
  return data;
}

export async function checkInBooking(id: string): Promise<AdminBooking> {
  const { data } = await api.put<AdminBooking>(`/hotel-admin/bookings/${id}/check-in`);
  return data;
}

export async function checkOutBooking(id: string): Promise<AdminBooking> {
  const { data } = await api.put<AdminBooking>(`/hotel-admin/bookings/${id}/check-out`);
  return data;
}

export async function cancelBookingAdmin(id: string): Promise<AdminBooking> {
  const { data } = await api.put<AdminBooking>(`/hotel-admin/bookings/${id}/cancel`);
  return data;
}

// Rooms
export async function getHotelRooms(hotelId: string): Promise<RoomManagementItem[]> {
  const { data } = await api.get<RoomManagementItem[]>(`/hotels/${hotelId}/rooms`);
  return data;
}

export async function createRoom(hotelId: string, roomData: CreateRoomData): Promise<RoomManagementItem> {
  const { data } = await api.post<RoomManagementItem>(`/hotels/${hotelId}/rooms`, roomData);
  return data;
}

export async function updateRoom(hotelId: string, roomId: string, roomData: UpdateRoomData): Promise<RoomManagementItem> {
  const { data } = await api.put<RoomManagementItem>(`/hotels/${hotelId}/rooms/${roomId}`, roomData);
  return data;
}

export async function deleteRoom(hotelId: string, roomId: string): Promise<void> {
  await api.delete(`/hotels/${hotelId}/rooms/${roomId}`);
}

// Hotel Profile
export async function getHotelProfile(hotelId: string): Promise<HotelProfileData> {
  const { data } = await api.get<HotelProfileData>(`/hotels/${hotelId}`);
  return data;
}

export async function updateHotelProfile(hotelId: string, hotelData: UpdateHotelData): Promise<HotelProfileData> {
  const { data } = await api.put<HotelProfileData>(`/hotels/${hotelId}`, hotelData);
  return data;
}

export { queryClient } from '../lib/api/queryClient';
