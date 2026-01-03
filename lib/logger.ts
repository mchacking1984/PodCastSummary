import { kv } from '@vercel/kv';

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
    // Check if KV is configured
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.log('Vercel KV not configured, skipping log save');
      return;
    }

    const logEntry: LogEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    // Get existing logs
    const existingLogs = await kv.get<LogEntry[]>(LOGS_KEY) || [];

    // Add new log at the beginning
    existingLogs.unshift(logEntry);

    // Keep only the last MAX_LOGS entries
    const trimmedLogs = existingLogs.slice(0, MAX_LOGS);

    // Save back to KV
    await kv.set(LOGS_KEY, trimmedLogs);

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
    // Check if KV is configured
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.log('Vercel KV not configured');
      return [];
    }

    const logs = await kv.get<LogEntry[]>(LOGS_KEY) || [];
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
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return;
    }
    await kv.del(LOGS_KEY);
    console.log('Logs cleared');
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
}
