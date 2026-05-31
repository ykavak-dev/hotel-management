import { setupWorker } from 'msw/browser';
import { http, HttpResponse } from 'msw';

const handlers = [
  // Auth handlers
  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'CUSTOMER' },
    }, { status: 201 });
  }),

  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'CUSTOMER' },
    });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({ id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'CUSTOMER' });
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      token: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token',
    });
  }),

  // Hotels handlers
  http.get('/api/hotels', () => {
    return HttpResponse.json([
      {
        id: 'hotel-1',
        name: 'Test Hotel Istanbul',
        city: 'Istanbul',
        country: 'Turkey',
        isVerified: true,
        averageRating: 4.2,
        amenities: ['wifi', 'pool'],
        images: ['https://example.com/hotel.jpg'],
        rooms: [
          { id: 'room-1', type: 'SINGLE', pricePerNight: 100, availableQuantity: 3, capacity: 2 },
          { id: 'room-2', type: 'SUITE', pricePerNight: 250, availableQuantity: 1, capacity: 4 },
        ],
      },
    ]);
  }),

  http.get('/api/hotels/:id', () => {
    return HttpResponse.json({
      id: 'hotel-1',
      name: 'Test Hotel Istanbul',
      city: 'Istanbul',
      country: 'Turkey',
      isVerified: true,
      averageRating: 4.2,
      amenities: ['wifi', 'pool'],
      images: ['https://example.com/hotel.jpg'],
      description: 'A lovely test hotel',
    });
  }),

  // Search handler
  http.get('/api/search/hotels', ({ request }) => {
    const url = new URL(request.url);
    const city = url.searchParams.get('location') || 'Istanbul';

    return HttpResponse.json({
      hotels: [
        {
          id: 'hotel-1',
          name: city ? `Hotel in ${city}` : 'Test Hotel',
          city: city,
          country: 'Turkey',
          isVerified: true,
          averageRating: 4.0,
          amenities: ['wifi', 'pool', 'gym'],
          images: ['https://example.com/hotel.jpg'],
          rooms: [
            { id: 'room-1', type: 'SINGLE', pricePerNight: 120, availableQuantity: 5, capacity: 2 },
          ],
        },
      ],
    });
  }),

  http.get('/api/search/availability', () => {
    return HttpResponse.json({
      rooms: [
        { id: 'room-1', type: 'SINGLE', pricePerNight: 100, availableQuantity: 3, capacity: 2 },
      ],
    });
  }),

  // Bookings handlers
  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: `booking-${Date.now()}`,
      roomId: body.roomId,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      numberOfGuests: body.numberOfGuests,
      status: 'PENDING',
      totalPrice: 240,
      payment: { id: 'pay-1', status: 'PENDING' },
    }, { status: 201 });
  }),

  http.get('/api/bookings', () => {
    return HttpResponse.json([
      {
        id: 'booking-1',
        room: { hotel: { name: 'Test Hotel' }, type: 'SINGLE' },
        checkIn: '2026-05-10',
        checkOut: '2026-05-12',
        status: 'CONFIRMED',
        totalPrice: 200,
      },
    ]);
  }),

  http.delete('/api/bookings/:id', () => {
    return HttpResponse.json({ refundAmount: 200 });
  }),

  // Hotel admin dashboard
  http.get('/api/hotel-admin/dashboard', () => {
    return HttpResponse.json({
      stats: { totalBookings: 12, totalRevenue: 5400, occupancyRate: 72 },
      recentBookings: [],
    });
  }),

  // System admin handlers
  http.get('/api/admin/dashboard', () => {
    return HttpResponse.json({
      stats: { totalUsers: 50, totalHotels: 25, pendingHotels: 3, totalBookings: 100 },
      recentActivity: [],
    });
  }),

  http.get('/api/admin/users', () => {
    return HttpResponse.json([
      { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'CUSTOMER', isActive: true },
    ]);
  }),

  http.get('/api/admin/hotels', () => {
    return HttpResponse.json([
      { id: 'hotel-1', name: 'Test Hotel', city: 'Istanbul', isVerified: false },
    ]);
  }),

  http.get('/api/admin/reviews', () => {
    return HttpResponse.json([
      { id: 'review-1', rating: 4, comment: 'Great', isApproved: false },
    ]);
  }),

  // Reviews
  http.get('/api/reviews/hotel/:hotelId', () => {
    return HttpResponse.json({
      reviews: [
        { id: 'review-1', rating: 4, comment: 'Great hotel!', userName: 'Test User', createdAt: '2026-05-01' },
      ],
      pagination: { page: 1, limit: 10, total: 1 },
    });
  }),

  http.post('/api/reviews', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: `review-${Date.now()}`,
      hotelId: body.hotelId,
      rating: body.rating,
      comment: body.comment,
      userId: 'user-1',
      userName: 'Test User',
      isApproved: false,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),
];

export const worker = setupWorker(...handlers);
