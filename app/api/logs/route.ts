import { NextRequest, NextResponse } from 'next/server';
import { getLogs, clearLogs } from '@/lib/logger';

/**
 * GET /api/logs - Fetch all logs (password protected)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Check for password in Authorization header
  const authHeader = request.headers.get('Authorization');
  const password = process.env.LOGS_PASSWORD;

  if (!password) {
    return NextResponse.json(
      { error: 'LOGS_PASSWORD environment variable not configured' },
      { status: 500 }
    );
  }

  // Expected format: "Bearer <password>"
  const providedPassword = authHeader?.replace('Bearer ', '');

  if (!providedPassword || providedPassword !== password) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const logs = await getLogs();
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/logs - Clear all logs (password protected)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  // Check for password in Authorization header
  const authHeader = request.headers.get('Authorization');
  const password = process.env.LOGS_PASSWORD;

  if (!password) {
    return NextResponse.json(
      { error: 'LOGS_PASSWORD environment variable not configured' },
      { status: 500 }
    );
  }

  const providedPassword = authHeader?.replace('Bearer ', '');

  if (!providedPassword || providedPassword !== password) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await clearLogs();
    return NextResponse.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    );
  }
}
