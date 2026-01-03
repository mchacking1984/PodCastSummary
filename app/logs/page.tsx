'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface LogEntry {
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

function HeadphoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

export default function LogsPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (pwd: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/logs', {
        headers: {
          Authorization: `Bearer ${pwd}`,
        },
      });

      if (response.status === 401) {
        setError('Invalid password');
        setIsAuthenticated(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to fetch logs');
        return;
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setIsAuthenticated(true);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchLogs(password);
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      if (response.ok) {
        setLogs([]);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to clear logs');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[--background]">
        {/* Navigation */}
        <nav className="border-b border-[--border] sticky top-0 bg-[--background]/95 backdrop-blur-sm z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <HeadphoneIcon className="w-8 h-8 text-[--accent]" />
                <span className="text-xl font-bold tracking-tight">PODSUMMARIZE</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-md mx-auto px-4 py-16">
          <div className="card p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[--accent]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Logs</h1>
              <p className="text-[--foreground-muted] mt-2">Enter password to view activity logs</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="search-input w-full px-4 py-3 rounded-xl text-white outline-none"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="btn-primary w-full py-3 rounded-xl text-white font-medium disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Access Logs'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show logs
  return (
    <div className="min-h-screen bg-[--background]">
      {/* Navigation */}
      <nav className="border-b border-[--border] sticky top-0 bg-[--background]/95 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <HeadphoneIcon className="w-8 h-8 text-[--accent]" />
              <span className="text-xl font-bold tracking-tight">PODSUMMARIZE</span>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
              >
                Clear Logs
              </button>
              <button
                onClick={() => fetchLogs(password)}
                className="px-4 py-2 rounded-lg border border-[--border] text-[--foreground-muted] hover:text-white hover:border-[--accent] transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-[--foreground-muted] mt-1">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'} recorded
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {logs.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 text-[--foreground-muted] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[--foreground-muted]">No logs recorded yet</p>
            <p className="text-sm text-[--foreground-muted] mt-1">
              Logs will appear here after podcasts are summarized
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[--border] bg-[--background-secondary]">
                    <th className="text-left p-4 font-medium text-[--foreground-muted]">Timestamp</th>
                    <th className="text-left p-4 font-medium text-[--foreground-muted]">Podcast</th>
                    <th className="text-left p-4 font-medium text-[--foreground-muted]">Episode</th>
                    <th className="text-left p-4 font-medium text-[--foreground-muted]">Model</th>
                    <th className="text-left p-4 font-medium text-[--foreground-muted]">Duration</th>
                    <th className="text-left p-4 font-medium text-[--foreground-muted]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[--border] hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-[--foreground-muted] whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="p-4">
                        <span className="text-white font-medium">{log.podcastName}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-[--foreground-muted] text-sm max-w-xs truncate block">
                          {log.episodeTitle}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-[--accent]/10 text-[--accent] text-xs font-medium">
                          {log.model}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[--foreground-muted]">
                        {log.duration || '-'}
                      </td>
                      <td className="p-4">
                        {log.success ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-sm" title={log.error}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
