import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// In-memory test store for stateful mocking
export const testStore = {
  users: [
    { id: 'user-1', email: 'test@example.com', password: 'password123', firstName: 'Test', lastName: 'User', role: 'CUSTOMER' },
    { id: 'hotel-admin-1', email: 'hoteladmin@example.com', password: 'password123', firstName: 'Hotel', lastName: 'Admin', role: 'HOTEL_ADMIN', hotelId: 'hotel-1' },
    { id: 'sysadmin-1', email: 'sysadmin@example.com', password: 'password123', firstName: 'System', lastName: 'Admin', role: 'SYSTEM_ADMIN' },
  ],
  hotels: [
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
  ],
  bookings: [
    // Existing booking for overlap testing: Room room-1, 10 May - 13 May
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
    // Another existing booking: Room room-2, 15 May - 18 May
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
  ],
  reviews: [
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
  ],
};

// Helper to check date overlap
export function isDateOverlap(
  checkIn: string,
  checkOut: string,
  existingCheckIn: string,
  existingCheckOut: string
): boolean {
  const newCheckIn = new Date(checkIn);
  const newCheckOut = new Date(checkOut);
  const existCheckIn = new Date(existingCheckIn);
  const existCheckOut = new Date(existingCheckOut);

  // Overlap exists if: new check-in < existing check-out AND new check-out > existing check-in
  return newCheckIn < existCheckOut && newCheckOut > existCheckIn;
}

// Helper to get user from token
function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('mock-jwt-token-', '');
  return testStore.users.find(u => u.id === userId);
}

export const handlers = [
  // ==================== AUTH HANDLERS ====================
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as any;
    const existingUser = testStore.users.find(u => u.email === body.email);

    if (existingUser) {
      return HttpResponse.json(
        { error: 'Email already registered', code: 'EMAIL_EXISTS' },
        { status: 409 }
      );
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: 'CUSTOMER' as const,
    };
    testStore.users.push(newUser);

    return HttpResponse.json({
      token: `mock-jwt-token-${newUser.id}`,
      refreshToken: `mock-refresh-token-${newUser.id}`,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
    }, { status: 201 });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    const user = testStore.users.find(u => u.email === body.email);

    if (!user) {
      return HttpResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    if (user.password !== body.password) {
      return HttpResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      token: `mock-jwt-token-${user.id}`,
      refreshToken: `mock-refresh-token-${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      token: `mock-jwt-token-refreshed-${Date.now()}`,
      refreshToken: `mock-refresh-token-refreshed-${Date.now()}`,
    });
  }),

  // ==================== HOTELS HANDLERS ====================
  http.get('/api/hotels', () => {
    return HttpResponse.json(testStore.hotels);
  }),

  http.get('/api/hotels/:id', ({ params }) => {
    const hotel = testStore.hotels.find(h => h.id === params.id);
    if (!hotel) {
      return HttpResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    return HttpResponse.json(hotel);
  }),

  http.get('/api/hotels/:id/reviews', ({ params }) => {
    const reviews = testStore.reviews.filter(
      r => r.hotelId === params.id && r.isApproved
    );
    return HttpResponse.json(reviews);
  }),

  // ==================== SEARCH HANDLERS ====================
  http.get('/api/search/hotels', ({ request }) => {
    const url = new URL(request.url);
    const city = url.searchParams.get('location');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const roomType = url.searchParams.get('roomType');
    const amenities = url.searchParams.getAll('amenities');

    let hotels = [...testStore.hotels];

    // Filter by city/hotel name
    if (city) {
      hotels = hotels.filter(h =>
        h.city.toLowerCase().includes(city.toLowerCase()) ||
        h.name.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Filter by room type
    if (roomType) {
      hotels = hotels.map(h => ({
        ...h,
        rooms: h.rooms.filter(r => r.type === roomType),
      })).filter(h => h.rooms.length > 0);
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      hotels = hotels.map(h => ({
        ...h,
        rooms: h.rooms.filter(r => {
          if (minPrice && r.pricePerNight < parseInt(minPrice)) return false;
          if (maxPrice && r.pricePerNight > parseInt(maxPrice)) return false;
          return true;
        }),
      })).filter(h => h.rooms.length > 0);
    }

    // Filter by amenities
    if (amenities.length > 0) {
      hotels = hotels.filter(h =>
        amenities.every(a => h.amenities.includes(a))
      );
    }

    return HttpResponse.json({ hotels });
  }),

  http.get('/api/search/availability', ({ request }) => {
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');
    const roomId = url.searchParams.get('roomId');
    const checkIn = url.searchParams.get('checkIn');
    const checkOut = url.searchParams.get('checkOut');

    const hotel = hotelId ? testStore.hotels.find(h => h.id === hotelId) : null;
    if (hotelId && !hotel) {
      return HttpResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Get rooms to check
    let rooms = hotel ? hotel.rooms : testStore.hotels.flatMap(h => h.rooms);
    if (roomId) {
      rooms = rooms.filter(r => r.id === roomId);
    }

    // Check availability for each room
    const roomsWithAvailability = rooms.map(room => {
      // Count overlapping bookings
      const overlappingBookings = testStore.bookings.filter(
        b => b.roomId === room.id && b.status !== 'CANCELLED'
      );

      let effectiveAvailability = room.availableQuantity;

      if (checkIn && checkOut) {
        let bookedCount = 0;
        overlappingBookings.forEach(booking => {
          if (isDateOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut)) {
            bookedCount++;
          }
        });
        effectiveAvailability = Math.max(0, room.totalQuantity - bookedCount);
      }

      return {
        ...room,
        availableQuantity: effectiveAvailability,
      };
    });

    return HttpResponse.json({ rooms: roomsWithAvailability });
  }),

  // ==================== BOOKINGS HANDLERS ====================
  http.post('/api/bookings', async ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as any;

    // Validate required fields
    if (!body.roomId || !body.checkIn || !body.checkOut || !body.numberOfGuests) {
      return HttpResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find room and hotel
    let foundRoom: any = null;
    let foundHotel: any = null;
    for (const hotel of testStore.hotels) {
      const room = hotel.rooms.find(r => r.id === body.roomId);
      if (room) {
        foundRoom = room;
        foundHotel = hotel;
        break;
      }
    }

    if (!foundRoom) {
      return HttpResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check guest capacity
    if (body.numberOfGuests > foundRoom.capacity) {
      return HttpResponse.json(
        { error: `Room capacity is ${foundRoom.capacity} guests` },
        { status: 400 }
      );
    }

    // Check for overlapping bookings
    const existingBookings = testStore.bookings.filter(
      b => b.roomId === body.roomId && b.status !== 'CANCELLED'
    );

    for (const booking of existingBookings) {
      if (isDateOverlap(body.checkIn, body.checkOut, booking.checkIn, booking.checkOut)) {
        return HttpResponse.json(
          { error: 'Room is not available for the selected dates', code: 'DATE_OVERLAP' },
          { status: 409 }
        );
      }
    }

    // Check room availability
    let bookedCount = 0;
    existingBookings.forEach(booking => {
      if (isDateOverlap(body.checkIn, body.checkOut, booking.checkIn, booking.checkOut)) {
        bookedCount++;
      }
    });

    if (foundRoom.totalQuantity - bookedCount < 1) {
      return HttpResponse.json(
        { error: 'No rooms available for the selected dates', code: 'NO_AVAILABILITY' },
        { status: 409 }
      );
    }

    // Calculate total price
    const checkInDate = new Date(body.checkIn);
    const checkOutDate = new Date(body.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * foundRoom.pricePerNight;

    const newBooking = {
      id: `booking-${Date.now()}`,
      roomId: body.roomId,
      userId: user.id,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      numberOfGuests: body.numberOfGuests,
      status: 'PENDING' as const,
      totalPrice,
      payment: { id: `pay-${Date.now()}`, status: 'PENDING' },
    };

    testStore.bookings.push(newBooking);

    return HttpResponse.json({
      ...newBooking,
      room: foundRoom,
      hotel: { id: foundHotel.id, name: foundHotel.name },
    }, { status: 201 });
  }),

  http.get('/api/bookings', ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userBookings = [...testStore.bookings];

    // Filter based on role
    if (user.role === 'CUSTOMER') {
      userBookings = userBookings.filter(b => b.userId === user.id);
    } else if (user.role === 'HOTEL_ADMIN') {
      // Hotel admin sees bookings for their hotel
      const hotel = testStore.hotels.find(h => h.adminId === user.id);
      if (hotel) {
        const hotelRoomIds = hotel.rooms.map(r => r.id);
        userBookings = userBookings.filter(b => hotelRoomIds.includes(b.roomId));
      }
    }
    // SYSTEM_ADMIN sees all

    const bookingsWithDetails = userBookings.map(booking => {
      let room: any = null;
      let hotel: any = null;
      for (const h of testStore.hotels) {
        const r = h.rooms.find((rm: any) => rm.id === booking.roomId);
        if (r) {
          room = r;
          hotel = h;
          break;
        }
      }
      return {
        ...booking,
        room,
        hotel: hotel ? { id: hotel.id, name: hotel.name } : null,
      };
    });

    return HttpResponse.json(bookingsWithDetails);
  }),

  http.delete('/api/bookings/:id', ({ request, params }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const booking = testStore.bookings.find(b => b.id === params.id);
    if (!booking) {
      return HttpResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check ownership (owner or system admin can cancel)
    if (booking.userId !== user.id && user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already cancelled
    if (booking.status === 'CANCELLED') {
      return HttpResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
    }

    booking.status = 'CANCELLED';

    return HttpResponse.json({ refundAmount: booking.totalPrice });
  }),

  // ==================== HOTEL ADMIN HANDLERS ====================
  http.get('/api/hotel-admin/dashboard', ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'HOTEL_ADMIN' && user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hotel = testStore.hotels.find(h => h.adminId === user.id);
    if (!hotel) {
      return HttpResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    const hotelRoomIds = hotel.rooms.map(r => r.id);
    const hotelBookings = testStore.bookings.filter(b => hotelRoomIds.includes(b.roomId));

    return HttpResponse.json({
      hotel,
      stats: {
        totalBookings: hotelBookings.length,
        totalRevenue: hotelBookings.reduce((sum, b) => sum + b.totalPrice, 0),
        occupancyRate: Math.round((hotelBookings.length / hotel.rooms.length) * 100),
      },
      recentBookings: hotelBookings.slice(0, 5),
    });
  }),

  http.post('/api/hotels/:hotelId/rooms', async ({ request, params }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'HOTEL_ADMIN' && user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hotel = testStore.hotels.find(h => h.id === params.hotelId);
    if (!hotel) {
      return HttpResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    // Check ownership
    if (hotel.adminId !== user.id && user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as any;
    const newRoom = {
      id: `room-${Date.now()}`,
      type: body.type,
      pricePerNight: body.pricePerNight,
      availableQuantity: body.availableQuantity,
      capacity: body.capacity,
      totalQuantity: body.totalQuantity || body.availableQuantity,
      amenities: body.amenities || [],
    };

    hotel.rooms.push(newRoom);

    return HttpResponse.json(newRoom, { status: 201 });
  }),

  http.patch('/api/hotels/:hotelId/rooms/:roomId', async ({ request, params }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'HOTEL_ADMIN' && user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hotel = testStore.hotels.find(h => h.id === params.hotelId);
    if (!hotel) {
      return HttpResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    // Check ownership
    if (hotel.adminId !== user.id && user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const room = hotel.rooms.find(r => r.id === params.roomId);
    if (!room) {
      return HttpResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const body = await request.json() as any;
    // Update allowed fields
    if (body.pricePerNight !== undefined) room.pricePerNight = body.pricePerNight;
    if (body.availableQuantity !== undefined) room.availableQuantity = body.availableQuantity;
    if (body.capacity !== undefined) room.capacity = body.capacity;
    if (body.type !== undefined) room.type = body.type;

    return HttpResponse.json(room);
  }),

  // ==================== SYSTEM ADMIN HANDLERS ====================
  http.get('/api/admin/dashboard', ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return HttpResponse.json({
      stats: {
        totalUsers: testStore.users.length,
        totalHotels: testStore.hotels.length,
        pendingHotels: testStore.hotels.filter(h => !h.isVerified).length,
        totalBookings: testStore.bookings.length,
      },
      recentActivity: [],
    });
  }),

  http.get('/api/admin/users', ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return HttpResponse.json(testStore.users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: true,
    })));
  }),

  http.patch('/api/admin/hotels/:id/verify', ({ request, params }) => {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hotel = testStore.hotels.find(h => h.id === params.id);
    if (!hotel) {
      return HttpResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    hotel.isVerified = true;
    return HttpResponse.json(hotel);
  }),

  http.get('/api/admin/reviews', ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return HttpResponse.json(testStore.reviews);
  }),

  http.patch('/api/admin/reviews/:id/approve', ({ request, params }) => {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'SYSTEM_ADMIN') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const review = testStore.reviews.find(r => r.id === params.id);
    if (!review) {
      return HttpResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    review.isApproved = true;
    return HttpResponse.json(review);
  }),

  // ==================== REVIEW HANDLERS ====================
  http.post('/api/reviews', async ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as any;

    // Validate rating
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return HttpResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate comment
    if (!body.comment || body.comment.trim().length === 0) {
      return HttpResponse.json(
        { error: 'Review comment cannot be empty' },
        { status: 400 }
      );
    }

    const newReview = {
      id: `review-${Date.now()}`,
      hotelId: body.hotelId,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      rating: body.rating,
      comment: body.comment,
      isApproved: false,
      createdAt: new Date().toISOString(),
    };

    testStore.reviews.push(newReview);

    return HttpResponse.json(newReview, { status: 201 });
  }),

  http.get('/api/reviews/my-reviews', ({ request }) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userReviews = testStore.reviews.filter(r => r.userId === user.id);
    return HttpResponse.json(userReviews);
  }),
];

export const server = setupServer(...handlers);
