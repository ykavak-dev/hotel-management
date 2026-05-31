import { describe, it, expect, beforeEach } from 'vitest';
import { testStore, isDateOverlap } from './mocks/server';

// ==================== ROOM AVAILABILITY TESTS ====================

describe('Room Availability API', () => {
  describe('GET /api/search/availability', () => {
    it('returns available when room has free capacity', async () => {
      // Book room-1 for dates that don't overlap with existing bookings
      // Existing: booking-overlap-1 is room-1, 10 May - 13 May
      // So we try: 20 May - 23 May (should be available)
      const response = await fetch('/api/search/availability?hotelId=hotel-1&checkIn=2026-05-20&checkOut=2026-05-23');
      expect(response.status).toBe(200);

      const data = await response.json();
      const room1 = data.rooms.find((r: any) => r.id === 'room-1');

      // Should have availability (5 total, 1 booked for overlapping dates, 0 for non-overlapping)
      expect(room1.availableQuantity).toBeGreaterThan(0);
    });

    it('returns unavailable when room is already booked for overlapping dates', async () => {
      // Check availability for room-1 during the existing booking period
      // Existing: booking-overlap-1 is room-1, 10 May - 13 May
      const response = await fetch('/api/search/availability?hotelId=hotel-1&checkIn=2026-05-11&checkOut=2026-05-12');
      expect(response.status).toBe(200);

      const data = await response.json();
      const room1 = data.rooms.find((r: any) => r.id === 'room-1');

      // Should show 0 or reduced availability due to overlap
      expect(room1.availableQuantity).toBeLessThan(room1.totalQuantity);
    });

    it('prevents double booking for exact same dates', async () => {
      // Try to book room-1 for exact same dates as existing booking
      // Existing: 10 May - 13 May
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-05-10',
          checkOut: '2026-05-13',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(409); // Conflict
    });

    it('prevents booking for overlapping dates (contained within existing)', async () => {
      // Existing: 10 May - 13 May
      // New attempt: 11 May - 12 May (contained within existing)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-05-11',
          checkOut: '2026-05-12',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.code).toBe('DATE_OVERLAP');
    });

    it('prevents booking for overlapping dates (extends before existing)', async () => {
      // Existing: 10 May - 13 May
      // New attempt: 8 May - 11 May (extends before, overlaps start)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-05-08',
          checkOut: '2026-05-11',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(409);
    });

    it('prevents booking for overlapping dates (extends after existing)', async () => {
      // Existing: 10 May - 13 May
      // New attempt: 12 May - 15 May (extends after, overlaps end)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-05-12',
          checkOut: '2026-05-15',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(409);
    });

    it('prevents booking for overlapping dates (extends both sides)', async () => {
      // Existing: 10 May - 13 May
      // New attempt: 8 May - 15 May (completely surrounds existing)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-05-08',
          checkOut: '2026-05-15',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(409);
    });

    it('allows booking for non-overlapping dates (before existing)', async () => {
      // Existing: 10 May - 13 May
      // New attempt: 5 May - 8 May (completely before)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-05-05',
          checkOut: '2026-05-08',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(201);
    });

    it('allows booking for non-overlapping dates (after existing)', async () => {
      // Existing: 10 May - 13 May
      // New attempt: 15 May - 18 May (completely after)
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-05-15',
          checkOut: '2026-05-18',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(201);
    });

    it('allows adjacent bookings (check-out day is check-in day)', async () => {
      // Existing: 10 May - 13 May
      // New attempt: 13 May - 16 May (check-in is same as previous check-out)
      // This should be allowed as it's not an overlap
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-05-13',
          checkOut: '2026-05-16',
          numberOfGuests: 2,
        }),
      });

      // Should succeed because check-in equals previous check-out (no overlap)
      expect(response.status).toBe(201);
    });
  });
});

// ==================== BOOKING TESTS ====================

describe('Booking API', () => {
  describe('POST /api/bookings', () => {
    it('creates booking for available room', async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-07-01',
          checkOut: '2026-07-05',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(201);
      const booking = await response.json();
      expect(booking).toHaveProperty('id');
      expect(booking.roomId).toBe('room-1');
      expect(booking.checkIn).toBe('2026-07-01');
      expect(booking.checkOut).toBe('2026-07-05');
      expect(booking.status).toBe('PENDING');
      expect(booking.totalPrice).toBe(400); // 4 nights * 100
    });

    it('calculates total price correctly', async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-2', // 150 per night
          checkIn: '2026-07-10',
          checkOut: '2026-07-14', // 4 nights
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(201);
      const booking = await response.json();
      expect(booking.totalPrice).toBe(600); // 4 nights * 150
    });

    it('saves booking with correct user ID', async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-08-01',
          checkOut: '2026-08-03',
          numberOfGuests: 1,
        }),
      });

      expect(response.status).toBe(201);
      const booking = await response.json();
      expect(booking.userId).toBe('user-1');
    });

    it('rejects booking when room exceeds capacity', async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-1', // capacity is 2
          checkIn: '2026-09-01',
          checkOut: '2026-09-03',
          numberOfGuests: 5, // exceeds capacity
        }),
      });

      expect(response.status).toBe(400);
    });

    it('rejects booking without authentication', async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: 'room-1',
          checkIn: '2026-09-01',
          checkOut: '2026-09-03',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(401);
    });

    it('rejects booking for non-existent room', async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'non-existent-room',
          checkIn: '2026-09-01',
          checkOut: '2026-09-03',
          numberOfGuests: 2,
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/bookings', () => {
    it('returns user bookings for authenticated user', async () => {
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
      });

      expect(response.status).toBe(200);
      const bookings = await response.json();
      expect(Array.isArray(bookings)).toBe(true);

      // All bookings should belong to user-1
      bookings.forEach((booking: any) => {
        expect(booking.userId).toBe('user-1');
      });
    });

    it('includes booking details (room, hotel)', async () => {
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
      });

      expect(response.status).toBe(200);
      const bookings = await response.json();

      if (bookings.length > 0) {
        const booking = bookings[0];
        expect(booking).toHaveProperty('room');
        expect(booking).toHaveProperty('hotel');
      }
    });

    it('user cannot view another user bookings', async () => {
      // Register a second user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'seconduser@example.com',
          password: 'Password123!',
          firstName: 'Second',
          lastName: 'User',
        }),
      });
      expect(registerResponse.status).toBe(201);
      const { token: secondUserToken } = await registerResponse.json();

      // Second user makes a booking
      const secondUserBooking = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secondUserToken}`,
        },
        body: JSON.stringify({
          roomId: 'room-2',
          checkIn: '2026-11-15',
          checkOut: '2026-11-17',
          numberOfGuests: 2,
        }),
      });
      expect(secondUserBooking.status).toBe(201);

      // First user (user-1) tries to view bookings
      const user1Response = await fetch('/api/bookings', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
      });
      expect(user1Response.status).toBe(200);
      const user1Bookings = await user1Response.json();

      // First user should NOT see second user's booking
      const secondUserBookingId = (await secondUserBooking.json()).id;
      user1Bookings.forEach((booking: any) => {
        expect(booking.id).not.toBe(secondUserBookingId);
      });
    });

    it('hotel admin can view all bookings for their hotel', async () => {
      // Login as hotel admin
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hoteladmin@example.com',
          password: 'password123',
        }),
      });
      expect(loginResponse.status).toBe(200);
      const { token } = await loginResponse.json();

      // Hotel admin queries their bookings
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
      const bookings = await response.json();

      // Hotel admin should only see bookings for their hotel's rooms (hotel-1)
      bookings.forEach((booking: any) => {
        // All returned bookings should be for rooms in hotel-1
        expect(['room-1', 'room-2', 'room-3']).toContain(booking.roomId);
      });
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('user can cancel own booking', async () => {
      // First create a booking
      const createResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          roomId: 'room-3',
          checkIn: '2026-10-01',
          checkOut: '2026-10-03',
          numberOfGuests: 2,
        }),
      });
      expect(createResponse.status).toBe(201);
      const booking = await createResponse.json();

      // Then cancel it
      const cancelResponse = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
      });

      expect(cancelResponse.status).toBe(200);
      const result = await cancelResponse.json();
      expect(result).toHaveProperty('refundAmount');
    });

    it('cannot cancel another user booking', async () => {
      // Try to cancel user-1's booking while logged in as hotel admin
      const response = await fetch('/api/bookings/booking-overlap-1', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });

      expect(response.status).toBe(403);
    });

    it('returns 404 for non-existent booking', async () => {
      const response = await fetch('/api/bookings/non-existent-id', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
      });

      expect(response.status).toBe(404);
    });
  });
});

// ==================== DATE OVERLAP HELPER TESTS ====================

describe('Date Overlap Logic', () => {
  it('correctly identifies overlapping dates - contained within', () => {
    // Existing: 10-13, New: 11-12 (contained)
    expect(isDateOverlap('2026-05-11', '2026-05-12', '2026-05-10', '2026-05-13')).toBe(true);
  });

  it('correctly identifies overlapping dates - surrounds existing', () => {
    // Existing: 10-13, New: 8-15 (surrounds)
    expect(isDateOverlap('2026-05-08', '2026-05-15', '2026-05-10', '2026-05-13')).toBe(true);
  });

  it('correctly identifies overlapping dates - overlaps start', () => {
    // Existing: 10-13, New: 8-11 (overlaps start)
    expect(isDateOverlap('2026-05-08', '2026-05-11', '2026-05-10', '2026-05-13')).toBe(true);
  });

  it('correctly identifies overlapping dates - overlaps end', () => {
    // Existing: 10-13, New: 12-15 (overlaps end)
    expect(isDateOverlap('2026-05-12', '2026-05-15', '2026-05-10', '2026-05-13')).toBe(true);
  });

  it('correctly identifies non-overlapping dates - before', () => {
    // Existing: 10-13, New: 5-8 (completely before)
    expect(isDateOverlap('2026-05-05', '2026-05-08', '2026-05-10', '2026-05-13')).toBe(false);
  });

  it('correctly identifies non-overlapping dates - after', () => {
    // Existing: 10-13, New: 15-18 (completely after)
    expect(isDateOverlap('2026-05-15', '2026-05-18', '2026-05-10', '2026-05-13')).toBe(false);
  });

  it('allows adjacent dates (end equals start)', () => {
    // Existing: 10-13, New: 13-16 (check-in equals previous check-out)
    expect(isDateOverlap('2026-05-13', '2026-05-16', '2026-05-10', '2026-05-13')).toBe(false);
  });

  it('handles same start date', () => {
    expect(isDateOverlap('2026-05-10', '2026-05-15', '2026-05-10', '2026-05-13')).toBe(true);
  });

  it('handles same end date', () => {
    expect(isDateOverlap('2026-05-08', '2026-05-13', '2026-05-10', '2026-05-13')).toBe(true);
  });
});
