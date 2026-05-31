import { describe, it, expect } from 'vitest';

// ==================== HOTEL ADMIN TESTS ====================

describe('Hotel Admin API', () => {
  describe('Authentication & Authorization', () => {
    it('hotel admin can access dashboard with valid token', async () => {
      const response = await fetch('/api/hotel-admin/dashboard', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('hotel');
      expect(data).toHaveProperty('stats');
    });

    it('rejects unauthenticated request to hotel admin dashboard', async () => {
      const response = await fetch('/api/hotel-admin/dashboard');
      expect(response.status).toBe(401);
    });

    it('rejects normal user accessing hotel admin dashboard', async () => {
      const response = await fetch('/api/hotel-admin/dashboard', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
      });
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/hotels/:hotelId/rooms', () => {
    it('hotel admin can add room to own hotel', async () => {
      const response = await fetch('/api/hotels/hotel-1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
        body: JSON.stringify({
          type: 'DOUBLE',
          pricePerNight: 180,
          availableQuantity: 3,
          capacity: 4,
          totalQuantity: 5,
          amenities: ['wifi', 'minibar'],
        }),
      });

      expect(response.status).toBe(201);
      const room = await response.json();
      expect(room).toHaveProperty('id');
      expect(room.type).toBe('DOUBLE');
      expect(room.pricePerNight).toBe(180);
    });

    it('hotel admin cannot add room to another hotel', async () => {
      // hotel-admin-1 tries to add room to hotel-2 (which belongs to hotel-admin-2)
      const response = await fetch('/api/hotels/hotel-2/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
        body: JSON.stringify({
          type: 'SINGLE',
          pricePerNight: 100,
          availableQuantity: 2,
          capacity: 2,
        }),
      });

      expect(response.status).toBe(403);
    });

    it('normal user cannot add rooms', async () => {
      const response = await fetch('/api/hotels/hotel-1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          type: 'SINGLE',
          pricePerNight: 100,
          availableQuantity: 2,
          capacity: 2,
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/hotels/:hotelId/rooms/:roomId', () => {
    it('hotel admin can update own room price', async () => {
      const response = await fetch('/api/hotels/hotel-1/rooms/room-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
        body: JSON.stringify({
          pricePerNight: 150,
        }),
      });

      expect(response.status).toBe(200);
      const room = await response.json();
      expect(room.pricePerNight).toBe(150);
    });

    it('hotel admin can update own room availability', async () => {
      const response = await fetch('/api/hotels/hotel-1/rooms/room-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
        body: JSON.stringify({
          availableQuantity: 10,
        }),
      });

      expect(response.status).toBe(200);
      const room = await response.json();
      expect(room.availableQuantity).toBe(10);
    });

    it('hotel admin cannot update another hotel room', async () => {
      // hotel-admin-1 tries to update room in hotel-2
      const response = await fetch('/api/hotels/hotel-2/rooms/room-4', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
        body: JSON.stringify({
          pricePerNight: 99,
        }),
      });

      expect(response.status).toBe(403);
    });

    it('hotel admin can update room type', async () => {
      const response = await fetch('/api/hotels/hotel-1/rooms/room-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
        body: JSON.stringify({
          type: 'DOUBLE',
        }),
      });

      expect(response.status).toBe(200);
      const room = await response.json();
      expect(room.type).toBe('DOUBLE');
    });
  });

  describe('GET /api/bookings (Hotel Admin View)', () => {
    it('hotel admin can view bookings for own hotel', async () => {
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });

      expect(response.status).toBe(200);
      const bookings = await response.json();
      expect(Array.isArray(bookings)).toBe(true);

      // Should only see bookings for hotel-1 rooms
      bookings.forEach((booking: any) => {
        expect(['room-1', 'room-2', 'room-3']).toContain(booking.roomId);
      });
    });

    it('hotel admin cannot view bookings for another hotel', async () => {
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });

      expect(response.status).toBe(200);
      const bookings = await response.json();

      // Should not see room-4 (hotel-2's room)
      bookings.forEach((booking: any) => {
        expect(booking.roomId).not.toBe('room-4');
      });
    });
  });
});

// ==================== SYSTEM ADMIN TESTS ====================

describe('System Admin API', () => {
  describe('Authentication & Authorization', () => {
    it('system admin can access admin dashboard', async () => {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-sysadmin-1',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('stats');
      expect(data.stats).toHaveProperty('totalUsers');
      expect(data.stats).toHaveProperty('totalHotels');
    });

    it('rejects hotel admin accessing system admin dashboard', async () => {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });
      expect(response.status).toBe(403);
    });

    it('rejects normal user accessing system admin dashboard', async () => {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
      });
      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/admin/hotels/:id/verify', () => {
    it('system admin can verify a hotel', async () => {
      // hotel-3 is unverified
      const response = await fetch('/api/admin/hotels/hotel-3/verify', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-jwt-token-sysadmin-1',
        },
      });

      expect(response.status).toBe(200);
      const hotel = await response.json();
      expect(hotel.isVerified).toBe(true);
    });

    it('hotel admin cannot verify hotels', async () => {
      const response = await fetch('/api/admin/hotels/hotel-3/verify', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });

      expect(response.status).toBe(403);
    });

    it('returns 404 for non-existent hotel', async () => {
      const response = await fetch('/api/admin/hotels/non-existent/verify', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-jwt-token-sysadmin-1',
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/users', () => {
    it('system admin can view all users', async () => {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-sysadmin-1',
        },
      });

      expect(response.status).toBe(200);
      const users = await response.json();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      // Should include all roles
      const roles = users.map((u: any) => u.role);
      expect(roles).toContain('CUSTOMER');
      expect(roles).toContain('HOTEL_ADMIN');
      expect(roles).toContain('SYSTEM_ADMIN');
    });

    it('hotel admin cannot view all users', async () => {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/reviews', () => {
    it('system admin can view all reviews', async () => {
      const response = await fetch('/api/admin/reviews', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-sysadmin-1',
        },
      });

      expect(response.status).toBe(200);
      const reviews = await response.json();
      expect(Array.isArray(reviews)).toBe(true);
    });

    it('hotel admin cannot view all reviews', async () => {
      const response = await fetch('/api/admin/reviews', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/admin/reviews/:id/approve', () => {
    it('system admin can approve a review', async () => {
      const response = await fetch('/api/admin/reviews/review-1/approve', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-jwt-token-sysadmin-1',
        },
      });

      expect(response.status).toBe(200);
      const review = await response.json();
      expect(review.isApproved).toBe(true);
    });

    it('hotel admin cannot approve reviews', async () => {
      const response = await fetch('/api/admin/reviews/review-1/approve', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('System admin has full access', () => {
    it('system admin can manage any hotel rooms', async () => {
      // System admin can update any hotel's rooms
      const response = await fetch('/api/hotels/hotel-1/rooms/room-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-sysadmin-1',
        },
        body: JSON.stringify({
          pricePerNight: 999,
        }),
      });

      expect(response.status).toBe(200);
    });
  });
});
