import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import { connectToDatabase } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectToDatabase();

        const server = http.createServer(app);

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Server failed to start', error);
        process.exit(1);
    }
};

startServer();