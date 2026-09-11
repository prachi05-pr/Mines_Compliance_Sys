import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let isConnected = false;
let isConnectedToAtlas = false;
let memoryServer: MongoMemoryServer | null = null;

export function sanitizeMongoUri(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let uri = raw.trim();

  // Strip surrounding quotes if pasted with quotes
  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }

  // Remove literal angle brackets around user or pass if accidentally retained: e.g. <user>:<pass> -> user:pass
  uri = uri.replace(
    /^(mongodb(?:\+srv)?:\/\/)(?:<([^:>]+)>|([^:>]+)):(?:<([^@>]+)>|([^@>]+))@/i,
    (_match, proto, u1, u2, p1, p2) => {
      const user = (u1 || u2 || '').trim();
      const pass = (p1 || p2 || '').trim();
      return `${proto}${user}:${pass}@`;
    }
  );

  return uri;
}

export function isPlaceholderUri(uri: string): boolean {
  if (!uri || !uri.startsWith('mongodb')) return true;
  const lower = uri.toLowerCase();
  if (
    lower.includes('username:password') ||
    lower.includes('user:password') ||
    lower.includes('<user>') ||
    lower.includes('<password>') ||
    lower.includes('<username>')
  ) {
    return true;
  }
  return false;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const mongoUri = sanitizeMongoUri(rawUri);

  if (mongoUri && !isPlaceholderUri(mongoUri)) {
    try {
      console.log('Connecting to MongoDB Atlas cluster...');
      await mongoose.connect(mongoUri, {
        dbName: 'coal_mine_governance',
        serverSelectionTimeoutMS: 6000,
      });
      isConnected = true;
      isConnectedToAtlas = true;
      console.log('MongoDB connected successfully to MongoDB Atlas.');
      return mongoose;
    } catch (err: any) {
      console.info(`External MongoDB Atlas connection could not be established (${err.message}). Using high-performance managed in-memory MongoDB.`);
      isConnectedToAtlas = false;
    }
  } else {
    console.log('No external MONGO_URI configured or template placeholder detected. Initializing managed internal MongoDB instance...');
  }

  try {
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'coal_mine_governance',
        },
      });
    }
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    isConnected = true;
    isConnectedToAtlas = false;
    console.log(`MongoDB connected successfully to local/memory instance at ${memUri}`);
    return mongoose;
  } catch (err: any) {
    console.error('Fatal: Failed to connect to any MongoDB instance:', err);
    throw err;
  }
}

export function getDatabaseStatus() {
  const state = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  return {
    status: states[state] || 'Unknown',
    readyState: state,
    isAtlas: isConnectedToAtlas,
    host: mongoose.connection.host || 'local-in-memory',
    dbName: mongoose.connection.name || 'coal_mine_governance',
  };
}
