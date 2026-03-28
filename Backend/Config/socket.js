let io;

module.exports = {
    init: (httpServer) => {
        const { Server } = require('socket.io');
        io = new Server(httpServer, {
            cors: {
                origin: ['http://localhost:5173', 'https://civic-issue-reporting-rho.vercel.app'],
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                credentials: true
            }
        });

        // Simple auth: require the client to provide their userId in the handshake auth payload.
        // This prevents unauthenticated clients from joining arbitrary user rooms.
        io.use((socket, next) => {
            const { userId } = socket.handshake.auth || {};
            if (!userId) {
                return next(new Error('Unauthorized: missing userId'));
            }
            socket.authenticatedUserId = userId.toString();
            return next();
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('join_user_room', (userId) => {
                const requestedUserId = userId?.toString();
                const authenticatedUserId = socket.authenticatedUserId;
                if (!requestedUserId || requestedUserId !== authenticatedUserId) {
                    console.warn('Attempt to join unauthorized room:', requestedUserId, 'expected', authenticatedUserId);
                    socket.emit('error', 'Unauthorized room join attempt');
                    return;
                }

                socket.join(authenticatedUserId);
                console.log(`User ${authenticatedUserId} joined their room`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
