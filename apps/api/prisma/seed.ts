import { PrismaClient, UserRole, RoomType, BookingStatus, PaymentMethod, PaymentStatus, HotelOwnerRole } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1 system admin
  const systemAdmin = await prisma.user.create({
    data: {
      email: 'sysadmin@hotel.com',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      firstName: 'System',
      lastName: 'Admin',
      phone: '+1-555-0101',
      role: UserRole.SYSTEM_ADMIN,
      isActive: true,
    },
  });

  // 2 hotel admins
  const hotelAdmin1 = await prisma.user.create({
    data: {
      email: 'admin1@hotel.com',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      firstName: 'Alice',
      lastName: 'Manager',
      phone: '+1-555-0102',
      role: UserRole.HOTEL_ADMIN,
      isActive: true,
    },
  });

  const hotelAdmin2 = await prisma.user.create({
    data: {
      email: 'admin2@hotel.com',
      passwordHash: '$2a$10$hashedpasswordplaceholder',
      firstName: 'Bob',
      lastName: 'Director',
      phone: '+1-555-0103',
      role: UserRole.HOTEL_ADMIN,
      isActive: true,
    },
  });

  // 10 customers
  const customerData = [
    { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', phone: '+1-555-1001' },
    { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', phone: '+1-555-1002' },
    { email: 'michael.brown@example.com', firstName: 'Michael', lastName: 'Brown', phone: '+1-555-1003' },
    { email: 'emily.davis@example.com', firstName: 'Emily', lastName: 'Davis', phone: '+1-555-1004' },
    { email: 'david.wilson@example.com', firstName: 'David', lastName: 'Wilson', phone: '+1-555-1005' },
    { email: 'sarah.miller@example.com', firstName: 'Sarah', lastName: 'Miller', phone: '+1-555-1006' },
    { email: 'james.taylor@example.com', firstName: 'James', lastName: 'Taylor', phone: '+1-555-1007' },
    { email: 'laura.anderson@example.com', firstName: 'Laura', lastName: 'Anderson', phone: '+1-555-1008' },
    { email: 'robert.thomas@example.com', firstName: 'Robert', lastName: 'Thomas', phone: '+1-555-1009' },
    { email: 'linda.jackson@example.com', firstName: 'Linda', lastName: 'Jackson', phone: '+1-555-1010' },
  ];

  const customers: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (const c of customerData) {
    const customer = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: '$2a$10$hashedpasswordplaceholder',
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
    });
    customers.push(customer);
  }

  // 3 verified hotels
  const hotel1 = await prisma.hotel.create({
    data: {
      name: 'Grand Plaza Hotel',
      description: 'Luxury 5-star hotel in the heart of downtown with panoramic city views.',
      address: '123 Main Street',
      city: 'New York',
      country: 'USA',
      latitude: 40.7128,
      longitude: -74.0060,
      starRating: 5,
      amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'],
      images: ['https://example.com/h1-1.jpg', 'https://example.com/h1-2.jpg'],
      isVerified: true,
      ownerId: hotelAdmin1.id,
    },
  });

  const hotel2 = await prisma.hotel.create({
    data: {
      name: 'Seaside Resort',
      description: 'Beautiful beachfront resort with private cabanas and water sports.',
      address: '456 Ocean Drive',
      city: 'Miami',
      country: 'USA',
      latitude: 25.7617,
      longitude: -80.1918,
      starRating: 4,
      amenities: ['WiFi', 'Pool', 'Beach Access', 'Restaurant', 'Room Service'],
      images: ['https://example.com/h2-1.jpg', 'https://example.com/h2-2.jpg'],
      isVerified: true,
      ownerId: hotelAdmin2.id,
    },
  });

  const hotel3 = await prisma.hotel.create({
    data: {
      name: 'Mountain Lodge',
      description: 'Cozy alpine lodge perfect for skiing and winter getaways.',
      address: '789 Summit Road',
      city: 'Aspen',
      country: 'USA',
      latitude: 39.1911,
      longitude: -106.8175,
      starRating: 4,
      amenities: ['WiFi', 'Fireplace', 'Ski Rental', 'Hot Tub', 'Restaurant'],
      images: ['https://example.com/h3-1.jpg', 'https://example.com/h3-2.jpg'],
      isVerified: true,
      ownerId: hotelAdmin1.id,
    },
  });

  // 1 pending hotel
  const hotel4 = await prisma.hotel.create({
    data: {
      name: 'Urban Boutique Inn',
      description: 'A trendy boutique hotel awaiting verification.',
      address: '321 Trendy Ave',
      city: 'Austin',
      country: 'USA',
      latitude: 30.2672,
      longitude: -97.7431,
      starRating: 3,
      amenities: ['WiFi', 'Rooftop Bar', 'Coffee Shop'],
      images: ['https://example.com/h4-1.jpg'],
      isVerified: false,
      ownerId: hotelAdmin2.id,
    },
  });

  // HotelOwner records
  await prisma.hotelOwner.create({
    data: { userId: hotelAdmin1.id, hotelId: hotel1.id, role: HotelOwnerRole.OWNER },
  });
  await prisma.hotelOwner.create({
    data: { userId: hotelAdmin2.id, hotelId: hotel2.id, role: HotelOwnerRole.OWNER },
  });
  await prisma.hotelOwner.create({
    data: { userId: hotelAdmin1.id, hotelId: hotel3.id, role: HotelOwnerRole.MANAGER },
  });
  await prisma.hotelOwner.create({
    data: { userId: hotelAdmin2.id, hotelId: hotel4.id, role: HotelOwnerRole.OWNER },
  });

  // Helper to create 5 rooms per hotel
  async function createRoomsForHotel(hotelId: string, basePrice: number) {
    const roomConfigs = [
      { type: RoomType.SINGLE, capacity: 1, bedType: 'Twin', roomSize: 18, totalQuantity: 5 },
      { type: RoomType.DOUBLE, capacity: 2, bedType: 'Queen', roomSize: 25, totalQuantity: 8 },
      { type: RoomType.SUITE, capacity: 2, bedType: 'King', roomSize: 45, totalQuantity: 3 },
      { type: RoomType.DELUXE, capacity: 3, bedType: 'King + Twin', roomSize: 55, totalQuantity: 2 },
      { type: RoomType.FAMILY, capacity: 4, bedType: 'Two Queens', roomSize: 60, totalQuantity: 2 },
    ];

    const rooms: Awaited<ReturnType<typeof prisma.room.create>>[] = [];
    for (let i = 0; i < roomConfigs.length; i++) {
      const rc = roomConfigs[i];
      const room = await prisma.room.create({
        data: {
          hotelId,
          type: rc.type,
          description: `${rc.type} room with ${rc.bedType} bed`,
          pricePerNight: basePrice + i * 30,
          capacity: rc.capacity,
          bedType: rc.bedType,
          roomSize: rc.roomSize,
          amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
          images: [`https://example.com/room-${hotelId}-${i}.jpg`],
          totalQuantity: rc.totalQuantity,
        },
      });
      rooms.push(room);
    }
    return rooms;
  }

  const rooms1 = await createRoomsForHotel(hotel1.id, 150);
  const rooms2 = await createRoomsForHotel(hotel2.id, 120);
  const rooms3 = await createRoomsForHotel(hotel3.id, 140);
  const rooms4 = await createRoomsForHotel(hotel4.id, 90);

  const allRooms = [...rooms1, ...rooms2, ...rooms3, ...rooms4];

  // 15 sample bookings
  const bookingData = [
    { customerIdx: 0, roomIdx: 0, checkInOffset: -10, nights: 2, guests: 1, status: BookingStatus.COMPLETED, price: 150 },
    { customerIdx: 1, roomIdx: 1, checkInOffset: -8, nights: 3, guests: 2, status: BookingStatus.COMPLETED, price: 360 },
    { customerIdx: 2, roomIdx: 5, checkInOffset: -5, nights: 1, guests: 1, status: BookingStatus.CANCELLED, price: 120 },
    { customerIdx: 3, roomIdx: 6, checkInOffset: -3, nights: 4, guests: 2, status: BookingStatus.COMPLETED, price: 600 },
    { customerIdx: 4, roomIdx: 10, checkInOffset: -1, nights: 2, guests: 2, status: BookingStatus.COMPLETED, price: 280 },
    { customerIdx: 5, roomIdx: 12, checkInOffset: 0, nights: 3, guests: 3, status: BookingStatus.CONFIRMED, price: 510 },
    { customerIdx: 6, roomIdx: 2, checkInOffset: 1, nights: 2, guests: 2, status: BookingStatus.PENDING, price: 360 },
    { customerIdx: 7, roomIdx: 7, checkInOffset: 2, nights: 5, guests: 2, status: BookingStatus.CONFIRMED, price: 900 },
    { customerIdx: 8, roomIdx: 15, checkInOffset: 3, nights: 1, guests: 1, status: BookingStatus.PENDING, price: 90 },
    { customerIdx: 9, roomIdx: 16, checkInOffset: 5, nights: 4, guests: 2, status: BookingStatus.CONFIRMED, price: 520 },
    { customerIdx: 0, roomIdx: 3, checkInOffset: 7, nights: 2, guests: 3, status: BookingStatus.PENDING, price: 420 },
    { customerIdx: 1, roomIdx: 8, checkInOffset: 10, nights: 3, guests: 2, status: BookingStatus.CONFIRMED, price: 540 },
    { customerIdx: 2, roomIdx: 11, checkInOffset: 12, nights: 2, guests: 2, status: BookingStatus.NO_SHOW, price: 320 },
    { customerIdx: 3, roomIdx: 18, checkInOffset: 14, nights: 1, guests: 4, status: BookingStatus.PENDING, price: 210 },
    { customerIdx: 4, roomIdx: 4, checkInOffset: 15, nights: 6, guests: 2, status: BookingStatus.CONFIRMED, price: 1260 },
  ];

  const now = new Date();
  const createdBookings: Awaited<ReturnType<typeof prisma.booking.create>>[] = [];

  for (const b of bookingData) {
    const checkIn = new Date(now);
    checkIn.setDate(checkIn.getDate() + b.checkInOffset);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + b.nights);

    const booking = await prisma.booking.create({
      data: {
        userId: customers[b.customerIdx].id,
        roomId: allRooms[b.roomIdx].id,
        checkIn,
        checkOut,
        numberOfGuests: b.guests,
        totalPrice: b.price,
        status: b.status,
        specialRequests: b.guests > 2 ? 'Extra towels and crib please' : undefined,
      },
    });
    createdBookings.push(booking);

    // Create payment for confirmed/completed bookings
    if (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: b.price,
          currency: 'USD',
          paymentMethod: PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.PAID,
          transactionId: `txn_${Math.random().toString(36).substring(2, 10)}`,
          paidAt: checkIn,
        },
      });
    }
  }

  // 8 reviews
  const reviewData = [
    { bookingIdx: 0, rating: 5, comment: 'Absolutely fantastic stay! The staff was incredibly welcoming.' },
    { bookingIdx: 1, rating: 4, comment: 'Great location and comfortable rooms. Would recommend.' },
    { bookingIdx: 3, rating: 5, comment: 'Best hotel experience I have had in years. Loved the spa.' },
    { bookingIdx: 4, rating: 3, comment: 'Good but the room service was a bit slow.' },
    { bookingIdx: 5, rating: 4, comment: 'Clean, modern, and great value for money.' },
    { bookingIdx: 7, rating: 5, comment: 'Perfect beach vacation. Kids loved the pool area.' },
    { bookingIdx: 9, rating: 4, comment: 'Lovely mountain views and cozy fireplace.' },
    { bookingIdx: 11, rating: 2, comment: 'Room was smaller than expected. Okay for a short stay.' },
  ];

  for (const r of reviewData) {
    const booking = createdBookings[r.bookingIdx];
    const room = allRooms.find((rm) => rm.id === booking.roomId)!;
    await prisma.review.create({
      data: {
        userId: booking.userId,
        hotelId: room.hotelId,
        bookingId: booking.id,
        rating: r.rating,
        comment: r.comment,
        isApproved: r.rating >= 4,
      },
    });
  }

  // Admin activity logs
  await prisma.adminActivityLog.create({
    data: {
      adminId: systemAdmin.id,
      action: 'VERIFY_HOTEL',
      entityType: 'Hotel',
      entityId: hotel1.id,
      details: { reason: 'Initial verification' },
    },
  });

  await prisma.adminActivityLog.create({
    data: {
      adminId: systemAdmin.id,
      action: 'VERIFY_HOTEL',
      entityType: 'Hotel',
      entityId: hotel2.id,
      details: { reason: 'Initial verification' },
    },
  });

  await prisma.adminActivityLog.create({
    data: {
      adminId: systemAdmin.id,
      action: 'VERIFY_HOTEL',
      entityType: 'Hotel',
      entityId: hotel3.id,
      details: { reason: 'Initial verification' },
    },
  });

  console.log('✅ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
