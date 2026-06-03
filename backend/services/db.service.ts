import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export class DBService {
    static async connect() {
        try {
            const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/brahma';
            await mongoose.connect(mongoUri);
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }
}
