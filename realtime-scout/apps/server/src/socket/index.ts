import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const userSockets = new Map<number, string>();

let ioInstance: Server;

export function setupSocket(io: Server) {
  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('未授权'));
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as { userId: number };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('token无效'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as number;
    userSockets.set(userId, socket.id);

    socket.on('disconnect', () => {
      userSockets.delete(userId);
    });
  });
}

export function emitToUser(userId: number, event: string, data: any) {
  const socketId = userSockets.get(userId);
  if (socketId && ioInstance) {
    ioInstance.to(socketId).emit(event, data);
  }
}
