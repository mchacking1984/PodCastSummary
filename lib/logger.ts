import { createClient, kv } from '@vercel/kv';

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

/**
 * Get the KV client - supports multiple env var naming conventions
 */
function getKVClient() {
  // Log available env vars for debugging (only log presence, not values)
  console.log('KV Config check:', {
    hasStorageRestApiUrl: !!process.env.STORAGE_REST_API_URL,
    hasStorageRestApiToken: !!process.env.STORAGE_REST_API_TOKEN,
    hasStorageUrl: !!process.env.STORAGE_URL,
    hasKvRestApiUrl: !!process.env.KV_REST_API_URL,
    hasKvRestApiToken: !!process.env.KV_REST_API_TOKEN,
    hasKvUrl: !!process.env.KV_URL,
    hasRedisUrl: !!process.env.REDIS_URL,
  });

  // Check for custom prefix naming (e.g., STORAGE_REST_API_URL)
  if (process.env.STORAGE_REST_API_URL && process.env.STORAGE_REST_API_TOKEN) {
    console.log('Using STORAGE_REST_API_* credentials');
    return createClient({
      url: process.env.STORAGE_REST_API_URL,
      token: process.env.STORAGE_REST_API_TOKEN,
    });
  }

  // Check for standard KV naming (uses default kv export)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    console.log('Using KV_REST_API_* credentials');
    return kv;
  }

  console.log('No KV credentials found');
  return null;
}

/**
 * Check if Vercel KV is configured
 */
function isKVConfigured(): boolean {
  return getKVClient() !== null;
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
    const client = getKVClient();
    if (!client) {
      console.log('Vercel KV/Redis not configured, skipping log save');
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

    // Save back to KV
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
    const client = getKVClient();
    if (!client) {
      console.log('Vercel KV/Redis not configured');
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
    const client = getKVClient();
    if (!client) {
      return;
    }
    await client.del(LOGS_KEY);
    console.log('Logs cleared');
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
}
