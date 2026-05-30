import mongoose, { ConnectOptions } from 'mongoose';

const DB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/brahma';
const RETRY_DELAY_MS = 5000;

export class DBService {
  private static isConnected: boolean = false;
  private static retryTimer: ReturnType<typeof setTimeout> | null = null;

  public static async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('✅ Database is already connected.');
      return;
    }

    const options: ConnectOptions = {
      serverSelectionTimeoutMS: 5000,
    };

    try {
      console.log(`⏳ Attempting to connect to MongoDB...`);
      const conn = await mongoose.connect(DB_URI, options);
      this.isConnected = conn.connections[0].readyState === 1;

      // Listen for unexpected disconnections and auto-reconnect
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected. Scheduling reconnect...');
        this.isConnected = false;
        this.scheduleRetry();
      });

      mongoose.connection.on('error', (err: Error) => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      console.log('🚀 Successfully connected to MongoDB.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to connect to MongoDB: ${message}`);
      this.scheduleRetry();
    }
  }

  private static scheduleRetry(): void {
    if (this.retryTimer) return; // prevent duplicate timers
    this.retryTimer = setTimeout(async () => {
      this.retryTimer = null;
      await this.connect();
    }, RETRY_DELAY_MS);
  }

  public static async disconnect(): Promise<void> {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (!this.isConnected) return;
    await mongoose.disconnect();
    this.isConnected = false;
    console.log('🔌 Disconnected from MongoDB.');
  }

  public static getStatus(): { connected: boolean; uri: string } {
    return { connected: this.isConnected, uri: DB_URI };
  }
}

