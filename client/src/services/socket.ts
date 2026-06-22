import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(import.meta.env.VITE_SOCKET_URL, {
            autoConnect: false,
            withCredentials: true
        });
    }

    return socket;
};

export const connectSocket = (accessToken: string) => {
    const activeSocket = getSocket();

    if (!activeSocket.connected) {
        activeSocket.auth = {
            token: accessToken
        };

        activeSocket.connect();
    }
};

export const disconnectSocket = () => {
    const activeSocket = getSocket();

    if (activeSocket.connected) {
        activeSocket.disconnect();
    }
};

export const joinProjectRoom = (projectId: string) => {
    getSocket().emit('project:join', projectId);
};

export const leaveProjectRoom = (projectId: string) => {
    getSocket().emit('project:leave', projectId);
};