import '@testing-library/jest-dom';
import { afterAll, beforeAll, afterEach, vi } from 'vitest';
import { server, testStore } from './mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Polyfills for jsdom environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Polyfill fetch for MSW
if (typeof global.fetch === 'undefined') {
  global.fetch = vi.fn();
}

// Create a client for tests
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Wrapper for tests that need React Query
export function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Reset test store before each test to ensure test isolation
beforeEach(() => {
  // Reset test store to initial state
  testStore.users = [
    { id: 'user-1', email: 'test@example.com', password: 'password123', firstName: 'Test', lastName: 'User', role: 'CUSTOMER' },
    { id: 'hotel-admin-1', email: 'hoteladmin@example.com', password: 'password123', firstName: 'Hotel', lastName: 'Admin', role: 'HOTEL_ADMIN', hotelId: 'hotel-1' },
    { id: 'sysadmin-1', email: 'sysadmin@example.com', password: 'password123', firstName: 'System', lastName: 'Admin', role: 'SYSTEM_ADMIN' },
  ];
  testStore.hotels = [
    {
      id: 'hotel-1',
      name: 'Grand Hotel Istanbul',
      city: 'Istanbul',
      country: 'Turkey',
      isVerified: true,
      averageRating: 4.5,
      amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant'],
      images: ['https://example.com/hotel1.jpg'],
      adminId: 'hotel-admin-1',
      rooms: [
        { id: 'room-1', type: 'SINGLE', pricePerNight: 100, availableQuantity: 3, capacity: 2, totalQuantity: 5 },
        { id: 'room-2', type: 'DOUBLE', pricePerNight: 150, availableQuantity: 2, capacity: 4, totalQuantity: 3 },
        { id: 'room-3', type: 'SUITE', pricePerNight: 300, availableQuantity: 1, capacity: 6, totalQuantity: 2 },
      ],
    },
    {
      id: 'hotel-2',
      name: 'Beach Resort Antalya',
      city: 'Antalya',
      country: 'Turkey',
      isVerified: true,
      averageRating: 4.8,
      amenities: ['wifi', 'pool', 'beach', 'spa'],
      images: ['https://example.com/hotel2.jpg'],
      adminId: 'hotel-admin-2',
      rooms: [
        { id: 'room-4', type: 'FAMILY', pricePerNight: 250, availableQuantity: 2, capacity: 8, totalQuantity: 4 },
      ],
    },
    {
      id: 'hotel-3',
      name: 'Mountain Lodge Cappadocia',
      city: 'Cappadocia',
      country: 'Turkey',
      isVerified: false,
      averageRating: 4.2,
      amenities: ['wifi', 'fireplace', 'breakfast'],
      images: ['https://example.com/hotel3.jpg'],
      adminId: 'hotel-admin-3',
      rooms: [
        { id: 'room-5', type: 'DOUBLE', pricePerNight: 120, availableQuantity: 4, capacity: 4, totalQuantity: 6 },
      ],
    },
  ];
  testStore.bookings = [
    {
      id: 'booking-overlap-1',
      roomId: 'room-1',
      userId: 'user-1',
      checkIn: '2026-05-10',
      checkOut: '2026-05-13',
      numberOfGuests: 2,
      status: 'CONFIRMED',
      totalPrice: 300,
    },
    {
      id: 'booking-overlap-2',
      roomId: 'room-2',
      userId: 'user-1',
      checkIn: '2026-05-15',
      checkOut: '2026-05-18',
      numberOfGuests: 3,
      status: 'CONFIRMED',
      totalPrice: 450,
    },
  ];
  testStore.reviews = [
    {
      id: 'review-1',
      hotelId: 'hotel-1',
      userId: 'user-1',
      userName: 'Test User',
      rating: 5,
      comment: 'Amazing stay! Great service.',
      isApproved: true,
      createdAt: '2026-05-01T10:00:00Z',
    },
  ];
});

// Start the mock server for all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
