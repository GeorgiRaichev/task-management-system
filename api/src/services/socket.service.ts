import type { Server } from 'socket.io';

class SocketService {
    private io: Server | null = null;

    public setServer(io: Server) {
        this.io = io;
    }

    public emitToUser<T>(userId: string, event: string, payload: T) {
        this.io?.to(`user:${userId}`).emit(event, payload);
    }

    public emitToProject<T>(projectId: string, event: string, payload: T) {
        this.io?.to(`project:${projectId}`).emit(event, payload);
    }

    public emitToAll<T>(event: string, payload: T) {
        this.io?.emit(event, payload);
    }
}

export const socketService = new SocketService();