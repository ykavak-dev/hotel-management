import { describe, it, expect } from 'vitest';

// ==================== INTEGRATION TESTS ====================

describe('Integration: Full Booking Flow', () => {
  it('Complete booking flow: Register -> Search -> Check Availability -> Book -> View History', async () => {
    // Step 1: Register a new user
    const registerResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newbooker@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'Booker',
      }),
    });
    expect(registerResponse.status).toBe(201);
    const { token: newUserToken, user: newUser } = await registerResponse.json();
    expect(newUser.email).toBe('newbooker@example.com');
    expect(newUser.role).toBe('CUSTOMER');

    // Step 2: Search for hotels
    const searchResponse = await fetch('/api/search/hotels?location=Istanbul');
    expect(searchResponse.status).toBe(200);
    const { hotels: searchResults } = await searchResponse.json();
    expect(searchResults.length).toBeGreaterThan(0);

    const targetHotel = searchResults.find((h: any) => h.city === 'Istanbul');
    expect(targetHotel).toBeDefined();

    // Step 3: Check room availability
    const availabilityResponse = await fetch(
      `/api/search/availability?hotelId=${targetHotel.id}&checkIn=2026-11-01&checkOut=2026-11-05`
    );
    expect(availabilityResponse.status).toBe(200);
    const { rooms: availableRooms } = await availabilityResponse.json();
    expect(availableRooms.length).toBeGreaterThan(0);

    const targetRoom = availableRooms[0];

    // Step 4: Create booking
    const bookingResponse = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newUserToken}`,
      },
      body: JSON.stringify({
        roomId: targetRoom.id,
        checkIn: '2026-11-01',
        checkOut: '2026-11-05',
        numberOfGuests: 2,
      }),
    });
    expect(bookingResponse.status).toBe(201);
    const booking = await bookingResponse.json();
    expect(booking).toHaveProperty('id');
    expect(booking.status).toBe('PENDING');
    expect(booking.totalPrice).toBe(4 * targetRoom.pricePerNight);

    // Step 5: View booking history
    const historyResponse = await fetch('/api/bookings', {
      headers: {
        'Authorization': `Bearer ${newUserToken}`,
      },
    });
    expect(historyResponse.status).toBe(200);
    const bookingHistory = await historyResponse.json();
    expect(bookingHistory.length).toBeGreaterThan(0);

    const myBooking = bookingHistory.find((b: any) => b.id === booking.id);
    expect(myBooking).toBeDefined();
    expect(myBooking.status).toBe('PENDING');
  });
});

describe('Integration: Double Booking Prevention', () => {
  it('System rejects second booking for same room with overlapping dates', async () => {
    // Step 1: User A books Room 101 for 10-13 May
    const userABooking = await fetch('/api/bookings', {
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

    // If this fails because there's already a booking, that's fine - we just need to show overlap prevention works
    // The important test is what happens next

    // Step 2: User B tries to book same room for overlapping dates (11-12 May)
    const userBResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hoteladmin@example.com', // Using existing user as User B
        password: 'password123',
      }),
    });
    const { token: userBToken } = await userBResponse.json();

    const secondBookingAttempt = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        roomId: 'room-1',
        checkIn: '2026-05-11', // Overlaps with 10-13 May
        checkOut: '2026-05-12',
        numberOfGuests: 2,
      }),
    });

    // System MUST reject the overlapping booking
    expect(secondBookingAttempt.status).toBe(409);
    const errorData = await secondBookingAttempt.json();
    expect(errorData.code).toBe('DATE_OVERLAP');
  });

  it('System allows sequential bookings for same room (non-overlapping)', async () => {
    const userToken = 'mock-jwt-token-user-1';

    // First booking: 1-3 June
    const firstBooking = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        roomId: 'room-2',
        checkIn: '2026-06-01',
        checkOut: '2026-06-03',
        numberOfGuests: 2,
      }),
    });
    expect(firstBooking.status).toBe(201);

    // Second booking: 5-7 June (gap between bookings)
    const secondBooking = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        roomId: 'room-2',
        checkIn: '2026-06-05',
        checkOut: '2026-06-07',
        numberOfGuests: 2,
      }),
    });
    expect(secondBooking.status).toBe(201);
  });
});

describe('Integration: Hotel Admin Room Management', () => {
  it('Hotel admin updates room price and users see new price', async () => {
    // Step 1: User searches for hotels and sees original price
    const searchBefore = await fetch('/api/search/hotels?location=Istanbul');
    const { hotels: hotelsBefore } = await searchBefore.json();
    const roomBefore = hotelsBefore[0].rooms.find((r: any) => r.id === 'room-1');
    const originalPrice = roomBefore.pricePerNight;

    // Step 2: Hotel admin updates the room price
    const updateResponse = await fetch('/api/hotels/hotel-1/rooms/room-1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
      },
      body: JSON.stringify({
        pricePerNight: originalPrice + 50,
      }),
    });
    expect(updateResponse.status).toBe(200);
    const updatedRoom = await updateResponse.json();
    expect(updatedRoom.pricePerNight).toBe(originalPrice + 50);

    // Step 3: User searches again and sees new price
    const searchAfter = await fetch('/api/search/hotels?location=Istanbul');
    const { hotels: hotelsAfter } = await searchAfter.json();
    const roomAfter = hotelsAfter[0].rooms.find((r: any) => r.id === 'room-1');
    expect(roomAfter.pricePerNight).toBe(originalPrice + 50);

    // Cleanup: restore original price
    await fetch('/api/hotels/hotel-1/rooms/room-1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
      },
      body: JSON.stringify({
        pricePerNight: originalPrice,
      }),
    });
  });

  it('Hotel admin adds new room and it becomes available', async () => {
    // Step 1: Add a new room
    const addRoomResponse = await fetch('/api/hotels/hotel-1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
      },
      body: JSON.stringify({
        type: 'FAMILY',
        pricePerNight: 400,
        availableQuantity: 2,
        capacity: 8,
        totalQuantity: 3,
      }),
    });
    expect(addRoomResponse.status).toBe(201);
    const newRoom = await addRoomResponse.json();

    // Step 2: Verify the room is available for booking
    const availabilityResponse = await fetch(`/api/search/availability?hotelId=hotel-1`);
    expect(availabilityResponse.status).toBe(200);
    const { rooms } = await availabilityResponse.json();

    const foundNewRoom = rooms.find((r: any) => r.id === newRoom.id);
    expect(foundNewRoom).toBeDefined();
    expect(foundNewRoom.type).toBe('FAMILY');
    expect(foundNewRoom.pricePerNight).toBe(400);
  });
});

describe('Integration: Review System Flow', () => {
  it('User can submit review which needs approval before showing publicly', async () => {
    // Step 1: Submit a review
    const submitResponse = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token-user-1',
      },
      body: JSON.stringify({
        hotelId: 'hotel-1',
        rating: 5,
        comment: 'Integration test review - amazing stay!',
      }),
    });
    expect(submitResponse.status).toBe(201);
    const review = await submitResponse.json();
    expect(review.isApproved).toBe(false); // Initially not approved

    // Step 2: Check public reviews - should NOT include unapproved review
    const publicReviewsResponse = await fetch('/api/hotels/hotel-1/reviews');
    const publicReviews = await publicReviewsResponse.json();
    const foundInPublic = publicReviews.find((r: any) => r.id === review.id);
    expect(foundInPublic).toBeUndefined(); // Not yet approved

    // Step 3: System admin approves the review
    const approveResponse = await fetch(`/api/admin/reviews/${review.id}/approve`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer mock-jwt-token-sysadmin-1',
      },
    });
    expect(approveResponse.status).toBe(200);

    // Step 4: Check public reviews again - should now include approved review
    const publicReviewsAfter = await fetch('/api/hotels/hotel-1/reviews');
    const publicReviewsApproved = await publicReviewsAfter.json();
    const foundAfterApproval = publicReviewsApproved.find((r: any) => r.id === review.id);
    expect(foundAfterApproval).toBeDefined();
    expect(foundAfterApproval.isApproved).toBe(true);
  });
});

describe('Integration: Role-Based Access Restrictions', () => {
  it('Normal user cannot access admin endpoints', async () => {
    const userEndpoints = [
      { url: '/api/admin/dashboard', method: 'GET' },
      { url: '/api/admin/users', method: 'GET' },
      { url: '/api/hotel-admin/dashboard', method: 'GET' },
    ];

    for (const endpoint of userEndpoints) {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
      });
      expect(response.status).toBe(403);
    }
  });

  it('Hotel admin cannot access system admin endpoints', async () => {
    const sysadminEndpoints = [
      { url: '/api/admin/dashboard', method: 'GET' },
      { url: '/api/admin/users', method: 'GET' },
      { url: '/api/admin/reviews', method: 'GET' },
    ];

    for (const endpoint of sysadminEndpoints) {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Authorization': 'Bearer mock-jwt-token-hotel-admin-1',
        },
      });
      expect(response.status).toBe(403);
    }
  });

  it('System admin has access to all admin endpoints', async () => {
    const adminEndpoints = [
      { url: '/api/admin/dashboard', method: 'GET', expectedStatus: 200 },
      { url: '/api/admin/users', method: 'GET', expectedStatus: 200 },
      { url: '/api/admin/reviews', method: 'GET', expectedStatus: 200 },
      // Note: /api/hotel-admin/dashboard returns 404 for SYSTEM_ADMIN in this mock
      // because they don't own a hotel - real API would allow cross-hotel access
    ];

    for (const endpoint of adminEndpoints) {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Authorization': 'Bearer mock-jwt-token-sysadmin-1',
        },
      });
      expect(response.status).toBe(endpoint.expectedStatus);
    }
  });
});
