import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server, type Socket } from 'socket.io';
import { socketService } from './services/socket.service.js';

type SocketUserPayload = {
    userId: string;
    role: string;
};

const getCookieValue = (cookieHeader: string | undefined, name: string) => {
    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const targetCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

    if (!targetCookie) {
        return null;
    }

    const value = targetCookie.split('=')[1];

    if (!value) {
        return null;
    }

    return decodeURIComponent(value);
};

const getSocketToken = (socket: Socket) => {
    const authToken = socket.handshake.auth.token || socket.handshake.auth.accessToken;

    if (typeof authToken === 'string') {
        return authToken;
    }

    return getCookieValue(socket.handshake.headers.cookie, 'accessToken');
};

export const initializeWebSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    socketService.setServer(io);

    io.use((socket, next) => {
        const token = getSocketToken(socket);
        const jwtSecret = process.env.JWT_SECRET;

        if (!token || !jwtSecret) {
            return next(new Error('Unauthorized'));
        }

        try {
            const decoded = jwt.verify(token, jwtSecret) as SocketUserPayload;

            socket.data.user = {
                userId: decoded.userId,
                role: decoded.role
            };

            return next();
        } catch {
            return next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.data.user as SocketUserPayload;

        socket.join(`user:${user.userId}`);

        socket.on('project:join', (projectId: string) => {
            if (typeof projectId === 'string') {
                socket.join(`project:${projectId}`);
            }
        });

        socket.on('project:leave', (projectId: string) => {
            if (typeof projectId === 'string') {
                socket.leave(`project:${projectId}`);
            }
        });
    });

    return io;
};