'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  SUMMARY_TYPES,
  SummaryType,
  SummaryTypeInfo,
  GEMINI_MODELS,
  GeminiModel,
  GeminiModelInfo,
} from '@/lib/gemini';

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
  model?: string;
}

export default function PodcastSummarizer() {
  const [url, setUrl] = useState('');
  const [summaryType, setSummaryType] = useState<SummaryType>('quick-read');
  const [model, setModel] = useState<GeminiModel>('gemini-2.0-flash-exp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    episode: PodcastEpisode;
    summary: string;
    model: string;
  } | null>(null);
  const [showOptions, setShowOptions] = useState(false);

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
        body: JSON.stringify({ url, summaryType, model }),
      });

      const data: SummarizeResponse = await response.json();

      if (!data.success || !data.episode || !data.summary) {
        setError(data.error || 'Failed to generate summary');
        return;
      }

      setResult({
        episode: data.episode,
        summary: data.summary,
        model: data.model || model,
      });
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCostBadge = (tier: 'low' | 'medium' | 'high') => {
    const styles = {
      low: 'bg-green-500/20 text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-red-500/20 text-red-400',
    };
    const labels = { low: '$', medium: '$$', high: '$$$' };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[tier]}`}>
        {labels[tier]}
      </span>
    );
  };

  // If we have a result, show the results view
  if (result) {
    return (
      <div className="space-y-6">
        {/* Episode Info Card */}
        <div className="card p-6">
          <div className="flex gap-4">
            {result.episode.artworkUrl && (
              <Image
                src={result.episode.artworkUrl}
                alt={result.episode.podcastName}
                width={96}
                height={96}
                className="rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-white truncate">
                {result.episode.title}
              </h2>
              <p className="text-[--foreground-muted]">{result.episode.podcastName}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-[--foreground-muted]">
                {result.episode.duration && <span>Duration: {result.episode.duration}</span>}
                {result.episode.pubDate && (
                  <span>
                    Published: {new Date(result.episode.pubDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[--foreground-muted]">
                  Generated with {GEMINI_MODELS.find((m) => m.id === result.model)?.label || result.model}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Content */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {SUMMARY_TYPES.find((t) => t.id === summaryType)?.label || 'Summary'}
            </h3>
          </div>
          <div
            className="summary-content"
            dangerouslySetInnerHTML={{
              __html: formatMarkdown(result.summary),
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.summary);
            }}
            className="px-4 py-2 rounded-lg border border-[--border] text-[--foreground-muted]
                     hover:text-white hover:border-[--accent] transition-colors duration-200"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={() => {
              setResult(null);
              setUrl('');
            }}
            className="btn-primary px-4 py-2 rounded-lg text-white font-medium"
          >
            Summarize Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Search Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste an Apple Podcasts URL..."
            className="search-input w-full px-4 py-4 pr-12 rounded-xl text-white outline-none"
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg
                     bg-[--accent] hover:bg-[--accent-hover] disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <svg className="w-5 h-5 text-white spinner" fill="none" viewBox="0 0 24 24">
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
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>

        {/* Options Toggle */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 text-sm text-[--foreground-muted] hover:text-white transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showOptions ? 'Hide options' : 'Show options'}
        </button>

        {/* Expandable Options */}
        {showOptions && (
          <div className="space-y-4 pt-2">
            {/* Summary Type Selector */}
            <div>
              <label className="block text-sm font-medium text-[--foreground-muted] mb-2">
                Summary Format
              </label>
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value as SummaryType)}
                className="select-dropdown w-full px-4 py-3 rounded-xl outline-none"
                disabled={loading}
              >
                {SUMMARY_TYPES.map((type: SummaryTypeInfo) => (
                  <option key={type.id} value={type.id}>
                    {type.label} — {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-sm font-medium text-[--foreground-muted] mb-2">
                AI Model
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GEMINI_MODELS.map((m: GeminiModelInfo) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModel(m.id)}
                    disabled={loading}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      model === m.id
                        ? 'border-[--accent] bg-[--accent]/10'
                        : 'border-[--border] hover:border-[--accent]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white text-sm">{m.label}</span>
                      {getCostBadge(m.costTier)}
                    </div>
                    <p className="text-xs text-[--foreground-muted]">{m.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[--accent]/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-[--accent] spinner" fill="none" viewBox="0 0 24 24">
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
            </div>
            <div>
              <p className="font-medium text-white">Processing your podcast...</p>
              <p className="text-sm text-[--foreground-muted]">
                This may take a few minutes for longer episodes.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-[--foreground-muted]">
              <div className="w-2 h-2 rounded-full bg-[--accent] animate-pulse-slow" />
              Fetching podcast details...
            </div>
            <div className="flex items-center gap-2 text-sm text-[--foreground-muted]">
              <div className="w-2 h-2 rounded-full bg-[--border]" />
              Downloading audio...
            </div>
            <div className="flex items-center gap-2 text-sm text-[--foreground-muted]">
              <div className="w-2 h-2 rounded-full bg-[--border]" />
              Generating {SUMMARY_TYPES.find((t) => t.id === summaryType)?.label}...
            </div>
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
  return (
    text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Tables
      .replace(/^\|(.+)\|$/gim, (match) => {
        const cells = match
          .split('|')
          .filter((cell) => cell.trim())
          .map((cell) => cell.trim());
        if (cells.every((cell) => /^[-:]+$/.test(cell))) {
          return ''; // Skip separator rows
        }
        const isHeader = match.includes('---');
        const tag = isHeader ? 'th' : 'td';
        return `<tr>${cells.map((cell) => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
      })
      // Wrap table rows
      .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
      // Checkboxes
      .replace(/- \[ \] (.*$)/gim, '<li class="flex items-start gap-2"><span class="mt-1">☐</span><span>$1</span></li>')
      .replace(/- \[x\] (.*$)/gim, '<li class="flex items-start gap-2"><span class="mt-1">☑</span><span>$1</span></li>')
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
      .replace(/^([\s\S]*)$/, '<p>$1</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-3]>)/g, '$1')
      .replace(/(<\/h[1-3]>)<\/p>/g, '$1')
      .replace(/<p>(<ul>)/g, '$1')
      .replace(/(<\/ul>)<\/p>/g, '$1')
      .replace(/<p>(<table>)/g, '$1')
      .replace(/(<\/table>)<\/p>/g, '$1')
      .replace(/<p>(<blockquote>)/g, '$1')
      .replace(/(<\/blockquote>)<\/p>/g, '$1')
      .replace(/<p>(<hr>)/g, '$1')
      .replace(/(<hr>)<\/p>/g, '$1')
  );
}
