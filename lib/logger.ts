import { Redis } from '@upstash/redis';

export interface LogEntry {
  id: string;
  timestamp: string;
  podcastName: string;
  episodeTitle: string;
  model: string;
  summaryTypes: string[];
  duration?: string;
  success: boolean;
  error?: string;
}

const LOGS_KEY = 'podcast_logs';
const MAX_LOGS = 1000; // Keep last 1000 logs

// Cached Redis client
let redisClient: Redis | null = null;

/**
 * Get the Redis client - supports REDIS_URL env var
 */
function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  // Log available env vars for debugging (only log presence, not values)
  console.log('Redis Config check:', {
    hasRedisUrl: !!process.env.REDIS_URL,
    hasKvRestApiUrl: !!process.env.KV_REST_API_URL,
    hasKvRestApiToken: !!process.env.KV_REST_API_TOKEN,
  });

  // Check for REDIS_URL (Vercel Redis / Upstash format)
  if (process.env.REDIS_URL) {
    console.log('Using REDIS_URL');
    try {
      // Parse the REDIS_URL to extract components
      // Format: redis://default:password@host:port or rediss://...
      const url = new URL(process.env.REDIS_URL);
      const isSecure = url.protocol === 'rediss:';
      const host = url.hostname;
      const port = url.port || (isSecure ? '6379' : '6379');
      const password = url.password;

      // Construct the REST API URL format that @upstash/redis expects
      const restUrl = `https://${host}`;

      redisClient = new Redis({
        url: restUrl,
        token: password,
      });
      return redisClient;
    } catch (error) {
      console.error('Failed to parse REDIS_URL:', error);
      return null;
    }
  }

  // Check for Upstash REST API format
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    console.log('Using KV_REST_API_* credentials');
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    return redisClient;
  }

  console.log('No Redis credentials found');
  return null;
}

/**
 * Check if Redis is configured
 */
function isRedisConfigured(): boolean {
  return getRedisClient() !== null;
}

/**
 * Generate a unique ID for log entries
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save a log entry to the database
 */
export async function saveLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) {
      console.log('Redis not configured, skipping log save');
      return;
    }

    const logEntry: LogEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    // Get existing logs
    const existingLogs = await client.get<LogEntry[]>(LOGS_KEY) || [];

    // Add new log at the beginning
    existingLogs.unshift(logEntry);

    // Keep only the last MAX_LOGS entries
    const trimmedLogs = existingLogs.slice(0, MAX_LOGS);

    // Save back to Redis
    await client.set(LOGS_KEY, trimmedLogs);

    console.log('Log saved:', logEntry.id);
  } catch (error) {
    console.error('Failed to save log:', error);
    // Don't throw - logging should not break the main functionality
  }
}

/**
 * Get all logs from the database
 */
export async function getLogs(): Promise<LogEntry[]> {
  try {
    const client = getRedisClient();
    if (!client) {
      console.log('Redis not configured');
      return [];
    }

    const logs = await client.get<LogEntry[]>(LOGS_KEY) || [];
    return logs;
  } catch (error) {
    console.error('Failed to get logs:', error);
    return [];
  }
}

/**
 * Clear all logs (admin function)
 */
export async function clearLogs(): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) {
      return;
    }
    await client.del(LOGS_KEY);
    console.log('Logs cleared');
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
}
