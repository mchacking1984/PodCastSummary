'use client';

import { useState } from 'react';
import { SUMMARY_TYPES, SummaryType, SummaryTypeInfo } from '@/lib/gemini';

interface PodcastEpisode {
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  pubDate: string;
  podcastName: string;
  artworkUrl: string;
}

interface SummarizeResponse {
  success: boolean;
  episode?: PodcastEpisode;
  summary?: string;
  error?: string;
}

export default function PodcastSummarizer() {
  const [url, setUrl] = useState('');
  const [summaryType, setSummaryType] = useState<SummaryType>('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ episode: PodcastEpisode; summary: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, summaryType }),
      });

      const data: SummarizeResponse = await response.json();

      if (!data.success || !data.episode || !data.summary) {
        setError(data.error || 'Failed to generate summary');
        return;
      }

      setResult({ episode: data.episode, summary: data.summary });
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="podcast-url"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Apple Podcast Episode URL
          </label>
          <input
            type="url"
            id="podcast-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://podcasts.apple.com/us/podcast/..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500"
            required
            disabled={loading}
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Paste a link to any Apple Podcasts episode
          </p>
        </div>

        <div>
          <label
            htmlFor="summary-type"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Summary Type
          </label>
          <select
            id="summary-type"
            value={summaryType}
            onChange={(e) => setSummaryType(e.target.value as SummaryType)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            {SUMMARY_TYPES.map((type: SummaryTypeInfo) => (
              <option key={type.id} value={type.id}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full py-3 px-6 rounded-lg font-medium text-white
                   bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   transition-colors duration-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing... This may take a few minutes
            </span>
          ) : (
            'Generate Summary'
          )}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-300">
                Processing your podcast...
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Fetching episode, downloading audio, and generating summary. This may take a few
                minutes for longer episodes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Episode Info Card */}
          <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              {result.episode.artworkUrl && (
                <img
                  src={result.episode.artworkUrl}
                  alt={result.episode.podcastName}
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {result.episode.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{result.episode.podcastName}</p>
                <div className="mt-2 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {result.episode.duration && <span>Duration: {result.episode.duration}</span>}
                  {result.episode.pubDate && (
                    <span>
                      Published: {new Date(result.episode.pubDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Content */}
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {SUMMARY_TYPES.find((t) => t.id === summaryType)?.label || 'Summary'}
            </h3>
            <div
              className="summary-content prose prose-gray dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(result.summary),
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.summary);
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                       transition-colors duration-200"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => {
                setResult(null);
                setUrl('');
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                       transition-colors duration-200"
            >
              Summarize Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple markdown to HTML converter for the summary display
 */
function formatMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>')
    // Wrap consecutive list items
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Blockquotes
    .replace(/^>\s+(.*)$/gim, '<blockquote>$1</blockquote>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Wrap in paragraphs
    .replace(/^(.*)$/s, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-3]>)/g, '$1')
    .replace(/(<\/h[1-3]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<blockquote>)/g, '$1')
    .replace(/(<\/blockquote>)<\/p>/g, '$1');
}
