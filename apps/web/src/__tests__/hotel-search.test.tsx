import { describe, it, expect } from 'vitest';

// ==================== HOTEL SEARCH TESTS ====================

describe('Hotel Search API', () => {
  describe('GET /api/search/hotels', () => {
    it('returns all hotels when no filters applied', async () => {
      const response = await fetch('/api/search/hotels');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();
      expect(Array.isArray(data.hotels)).toBe(true);
      expect(data.hotels.length).toBeGreaterThan(0);
    });

    it('returns hotels by location (city name)', async () => {
      const response = await fetch('/api/search/hotels?location=Istanbul');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();
      expect(data.hotels.length).toBeGreaterThan(0);
      expect(data.hotels.some((h: any) => h.city === 'Istanbul')).toBe(true);
    });

    it('returns hotels by hotel name', async () => {
      const response = await fetch('/api/search/hotels?location=Grand');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();
      expect(data.hotels.length).toBeGreaterThan(0);
      expect(data.hotels.some((h: any) => h.name === 'Grand Hotel Istanbul')).toBe(true);
    });

    it('returns empty array when no hotels match location', async () => {
      const response = await fetch('/api/search/hotels?location=NonExistentCity');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();
      expect(data.hotels.length).toBe(0);
    });

    it('filters hotels by price range (minPrice)', async () => {
      const response = await fetch('/api/search/hotels?minPrice=200');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();

      // All rooms in results should have price >= 200
      data.hotels.forEach((hotel: any) => {
        hotel.rooms.forEach((room: any) => {
          expect(room.pricePerNight).toBeGreaterThanOrEqual(200);
        });
      });
    });

    it('filters hotels by price range (maxPrice)', async () => {
      const response = await fetch('/api/search/hotels?maxPrice=150');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();

      // All rooms in results should have price <= 150
      data.hotels.forEach((hotel: any) => {
        hotel.rooms.forEach((room: any) => {
          expect(room.pricePerNight).toBeLessThanOrEqual(150);
        });
      });
    });

    it('filters hotels by price range (minPrice and maxPrice)', async () => {
      const response = await fetch('/api/search/hotels?minPrice=100&maxPrice=200');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();

      // All rooms should be within price range
      data.hotels.forEach((hotel: any) => {
        hotel.rooms.forEach((room: any) => {
          expect(room.pricePerNight).toBeGreaterThanOrEqual(100);
          expect(room.pricePerNight).toBeLessThanOrEqual(200);
        });
      });
    });

    it('filters hotels by room type', async () => {
      const response = await fetch('/api/search/hotels?roomType=SUITE');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();

      // All rooms should be SUITE type
      data.hotels.forEach((hotel: any) => {
        hotel.rooms.forEach((room: any) => {
          expect(room.type).toBe('SUITE');
        });
      });
    });

    it('filters hotels by single amenity', async () => {
      const response = await fetch('/api/search/hotels?amenities=wifi');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();

      // All hotels should have wifi amenity
      data.hotels.forEach((hotel: any) => {
        expect(hotel.amenities).toContain('wifi');
      });
    });

    it('filters hotels by multiple amenities (AND logic)', async () => {
      const response = await fetch('/api/search/hotels?amenities=wifi&amenities=pool');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();

      // All hotels should have BOTH wifi AND pool
      data.hotels.forEach((hotel: any) => {
        expect(hotel.amenities).toContain('wifi');
        expect(hotel.amenities).toContain('pool');
      });
    });

    it('returns empty list when no hotel matches all amenities', async () => {
      const response = await fetch('/api/search/hotels?amenities=nonexistent');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();
      expect(data.hotels.length).toBe(0);
    });

    it('combines multiple filters', async () => {
      const response = await fetch('/api/search/hotels?location=Istanbul&roomType=SUITE&minPrice=200');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();

      // Should filter by location, room type, and price
      data.hotels.forEach((hotel: any) => {
        expect(hotel.city).toBe('Istanbul');
        hotel.rooms.forEach((room: any) => {
          expect(room.type).toBe('SUITE');
          expect(room.pricePerNight).toBeGreaterThanOrEqual(200);
        });
      });
    });

    it('returns unverified hotels in search results', async () => {
      const response = await fetch('/api/search/hotels?location=Cappadocia');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.hotels).toBeDefined();

      // Mountain Lodge should be found (it's unverified)
      const found = data.hotels.find((h: any) => h.name === 'Mountain Lodge Cappadocia');
      expect(found).toBeDefined();
    });
  });

  describe('GET /api/search/availability', () => {
    it('returns room availability without dates', async () => {
      const response = await fetch('/api/search/availability?hotelId=hotel-1');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.rooms).toBeDefined();
      expect(Array.isArray(data.rooms)).toBe(true);
    });

    it('returns available rooms for specific dates', async () => {
      const response = await fetch('/api/search/availability?hotelId=hotel-1&checkIn=2026-06-01&checkOut=2026-06-05');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.rooms).toBeDefined();
      expect(data.rooms.length).toBeGreaterThan(0);

      // Each room should have availableQuantity
      data.rooms.forEach((room: any) => {
        expect(room).toHaveProperty('availableQuantity');
        expect(room).toHaveProperty('type');
        expect(room).toHaveProperty('pricePerNight');
      });
    });

    it('returns full availability when no overlapping bookings', async () => {
      // Check dates far in the future with no bookings
      const response = await fetch('/api/search/availability?hotelId=hotel-1&checkIn=2026-12-01&checkOut=2026-12-05');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.rooms).toBeDefined();

      // Room 1 should have totalQuantity - bookedCount available
      const room1 = data.rooms.find((r: any) => r.id === 'room-1');
      expect(room1.availableQuantity).toBe(5); // totalQuantity is 5
    });
  });

  describe('GET /api/hotels', () => {
    it('returns all hotels', async () => {
      const response = await fetch('/api/hotels');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('includes hotel details', async () => {
      const response = await fetch('/api/hotels');
      expect(response.status).toBe(200);

      const hotels = await response.json();
      const hotel = hotels[0];

      expect(hotel).toHaveProperty('id');
      expect(hotel).toHaveProperty('name');
      expect(hotel).toHaveProperty('city');
      expect(hotel).toHaveProperty('amenities');
      expect(hotel).toHaveProperty('rooms');
      expect(Array.isArray(hotel.rooms)).toBe(true);
    });

    it('returns specific hotel by id', async () => {
      const response = await fetch('/api/hotels/hotel-1');
      expect(response.status).toBe(200);

      const hotel = await response.json();
      expect(hotel.id).toBe('hotel-1');
      expect(hotel.name).toBe('Grand Hotel Istanbul');
    });

    it('returns 404 for non-existent hotel', async () => {
      const response = await fetch('/api/hotels/non-existent-id');
      expect(response.status).toBe(404);
    });
  });
});
