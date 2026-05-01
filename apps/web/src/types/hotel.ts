import type { RoomType } from '@hotel/shared';

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

export interface SearchResponse {
  hotels: HotelSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface AvailableRoom {
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
}

export interface AvailabilityResponse {
  hotelId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  availableRooms: AvailableRoom[];
}

export interface HotelReview {
  id: string;
  userId: string;
  hotelId: string;
  bookingId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

export interface ReviewListResponse {
  reviews: HotelReview[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  adults: number;
  children: number;
  rooms: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  starRating?: number;
  roomType?: RoomType;
  sortBy: 'price_asc' | 'price_desc' | 'rating_desc' | 'relevance';
  page: number;
}