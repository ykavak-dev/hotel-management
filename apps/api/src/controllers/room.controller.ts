import type { Request, Response, NextFunction } from 'express';
import { getRoomById, createRoom, updateRoom, softDeleteRoom } from '../services/room.service';
import { sendSuccess } from '../utils/response';


export async function getRoomDetailHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hotelId, roomId } = req.params;
    const room = await getRoomById(roomId, hotelId);
    sendSuccess(res, room);
  } catch (err) {
    next(err);
  }
}

export async function createRoomHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hotelId } = req.params;
    const room = await createRoom({
      ...req.body,
      hotelId,
    });
    sendSuccess(res, room, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateRoomHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hotelId, roomId } = req.params;
    const room = await updateRoom(roomId, hotelId, req.body);
    sendSuccess(res, room);
  } catch (err) {
    next(err);
  }
}

export async function deleteRoomHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hotelId, roomId } = req.params;
    await softDeleteRoom(roomId, hotelId);
    sendSuccess(res, { message: 'Room deleted successfully' });
  } catch (err) {
    next(err);
  }
}
