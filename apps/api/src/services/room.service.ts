import { prisma } from '../utils/db';
import { ApiError } from '../utils/ApiError';
import type { RoomType } from '../../generated/prisma';

export interface RoomDetail {
  id: string;
  hotelId: string;
  type: string;
  description: string | null;
  pricePerNight: number;
  capacity: number;
  bedType: string | null;
  roomSize: number | null;
  amenities: string[];
  images: string[];
  totalQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getRoomById(roomId: string, hotelId?: string): Promise<RoomDetail> {
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      ...(hotelId && { hotelId }),
      isActive: true,
    },
  });

  if (!room) {
    throw new ApiError('Room not found', 404, 'NOT_FOUND');
  }

  return {
    ...room,
    pricePerNight: Number(room.pricePerNight),
  };
}

export async function createRoom(data: {
  hotelId: string;
  type: string;
  description?: string;
  pricePerNight: number;
  capacity: number;
  bedType?: string;
  roomSize?: number;
  amenities?: string[];
  images?: string[];
  totalQuantity?: number;
}): Promise<RoomDetail> {
  const room = await prisma.room.create({
    data: {
      hotelId: data.hotelId,
      type: data.type as RoomType,
      description: data.description ?? null,
      pricePerNight: data.pricePerNight,
      capacity: data.capacity,
      bedType: data.bedType ?? null,
      roomSize: data.roomSize ?? null,
      amenities: data.amenities ?? [],
      images: data.images ?? [],
      totalQuantity: data.totalQuantity ?? 1,
    },
  });

  return {
    ...room,
    pricePerNight: Number(room.pricePerNight),
  };
}

export async function updateRoom(
  roomId: string,
  hotelId: string,
  data: {
    type?: string;
    description?: string;
    pricePerNight?: number;
    capacity?: number;
    bedType?: string;
    roomSize?: number;
    amenities?: string[];
    images?: string[];
    totalQuantity?: number;
    isActive?: boolean;
  },
): Promise<RoomDetail> {
  const existing = await prisma.room.findFirst({
    where: { id: roomId, hotelId },
  });

  if (!existing) {
    throw new ApiError('Room not found', 404, 'NOT_FOUND');
  }

  const room = await prisma.room.update({
    where: { id: roomId },
    data: {
      ...(data.type !== undefined && { type: data.type as RoomType }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.pricePerNight !== undefined && { pricePerNight: data.pricePerNight }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.bedType !== undefined && { bedType: data.bedType || null }),
      ...(data.roomSize !== undefined && { roomSize: data.roomSize ?? null }),
      ...(data.amenities !== undefined && { amenities: data.amenities }),
      ...(data.images !== undefined && { images: data.images }),
      ...(data.totalQuantity !== undefined && { totalQuantity: data.totalQuantity }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return {
    ...room,
    pricePerNight: Number(room.pricePerNight),
  };
}

export async function softDeleteRoom(roomId: string, hotelId: string): Promise<void> {
  const existing = await prisma.room.findFirst({
    where: { id: roomId, hotelId },
  });

  if (!existing) {
    throw new ApiError('Room not found', 404, 'NOT_FOUND');
  }

  await prisma.room.update({
    where: { id: roomId },
    data: { isActive: false },
  });
}
