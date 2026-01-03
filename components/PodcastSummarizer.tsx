'use client';

import { useState, useEffect } from 'react';
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

interface SummaryResult {
  summary: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  error?: string;
}

interface PodcastSummarizerProps {
  onResultChange?: (hasResult: boolean) => void;
}

export default function PodcastSummarizer({ onResultChange }: PodcastSummarizerProps) {
  const [url, setUrl] = useState('');
  const [model, setModel] = useState<GeminiModel>('gemini-2.5-flash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store episode info separately
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);

  // Store summaries for all types
  const [summaries, setSummaries] = useState<Record<SummaryType, SummaryResult>>(() => {
    const initial: Record<string, SummaryResult> = {};
    SUMMARY_TYPES.forEach((type) => {
      initial[type.id] = { summary: '', status: 'pending' };
    });
    return initial as Record<SummaryType, SummaryResult>;
  });

  // Currently selected summary type for viewing
  const [selectedType, setSelectedType] = useState<SummaryType>('executive-briefing');

  // Track if we have any results to show
  const hasAnyResult = Object.values(summaries).some((s) => s.status === 'complete');

  // Notify parent when result state changes
  useEffect(() => {
    onResultChange?.(hasAnyResult);
  }, [hasAnyResult, onResultChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEpisode(null);
    setLoading(true);

    // Reset all summaries to loading state
    const loadingState: Record<string, SummaryResult> = {};
    SUMMARY_TYPES.forEach((type) => {
      loadingState[type.id] = { summary: '', status: 'loading' };
    });
    setSummaries(loadingState as Record<SummaryType, SummaryResult>);

    // Make parallel requests for all summary types
    const requests = SUMMARY_TYPES.map(async (type) => {
      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, summaryType: type.id, model }),
        });

        const data: SummarizeResponse = await response.json();

        if (!data.success || !data.summary) {
          setSummaries((prev) => ({
            ...prev,
            [type.id]: {
              summary: '',
              status: 'error',
              error: data.error || 'Failed to generate summary',
            },
          }));
          return { type: type.id, success: false };
        }

        // Store episode info from first successful response
        if (data.episode) {
          setEpisode((prev) => prev || data.episode!);
        }

        setSummaries((prev) => ({
          ...prev,
          [type.id]: {
            summary: data.summary!,
            status: 'complete',
          },
        }));

        return { type: type.id, success: true };
      } catch (err) {
        setSummaries((prev) => ({
          ...prev,
          [type.id]: {
            summary: '',
            status: 'error',
            error: 'Network error',
          },
        }));
        return { type: type.id, success: false };
      }
    });

    try {
      const results = await Promise.all(requests);
      const anySuccess = results.some((r) => r.success);

      if (!anySuccess) {
        setError('Failed to generate any summaries. Please try again.');
      }
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

  const getStatusIcon = (status: SummaryResult['status']) => {
    switch (status) {
      case 'complete':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'loading':
        return (
          <svg className="w-4 h-4 text-[--accent] spinner" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <div className="w-4 h-4 rounded-full border-2 border-[--border]" />
        );
    }
  };

  // If we have results, show the results view
  if (hasAnyResult && episode) {
    const currentSummary = summaries[selectedType];

    return (
      <div className="w-full space-y-6">
        {/* Episode Header */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {episode.artworkUrl && (
              <Image
                src={episode.artworkUrl}
                alt={episode.podcastName}
                width={120}
                height={120}
                className="rounded-lg object-cover flex-shrink-0 mx-auto sm:mx-0"
              />
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white">
                {episode.title}
              </h2>
              <p className="text-lg text-[--foreground-muted] mt-1">{episode.podcastName}</p>
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-[--foreground-muted]">
                {episode.duration && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {episode.duration}
                  </span>
                )}
                {episode.pubDate && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(episode.pubDate).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {GEMINI_MODELS.find((m) => m.id === model)?.label || model}
                </span>
              </div>
            </div>
            <div className="flex sm:flex-col gap-2 justify-center">
              <button
                onClick={() => {
                  if (currentSummary.status === 'complete') {
                    navigator.clipboard.writeText(currentSummary.summary);
                  }
                }}
                disabled={currentSummary.status !== 'complete'}
                className="px-4 py-2 rounded-lg border border-[--border] text-[--foreground-muted]
                         hover:text-white hover:border-[--accent] transition-colors duration-200 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Copy Summary
              </button>
              <button
                onClick={() => {
                  setEpisode(null);
                  setUrl('');
                  const resetState: Record<string, SummaryResult> = {};
                  SUMMARY_TYPES.forEach((type) => {
                    resetState[type.id] = { summary: '', status: 'pending' };
                  });
                  setSummaries(resetState as Record<SummaryType, SummaryResult>);
                }}
                className="btn-primary px-4 py-2 rounded-lg text-white font-medium text-sm"
              >
                New Summary
              </button>
            </div>
          </div>
        </div>

        {/* Summary Type Tabs */}
        <div className="card p-2">
          <div className="flex flex-wrap gap-1">
            {SUMMARY_TYPES.map((type) => {
              const summary = summaries[type.id];
              const isSelected = selectedType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  disabled={summary.status === 'pending'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-[--accent] text-white'
                      : 'text-[--foreground-muted] hover:text-white hover:bg-white/5'
                    }
                    ${summary.status === 'pending' ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {getStatusIcon(summary.status)}
                  <span className="hidden sm:inline">{type.label}</span>
                  <span className="sm:hidden">{type.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Content */}
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[--border]">
            <div className="w-10 h-10 rounded-lg bg-[--accent]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {SUMMARY_TYPES.find((t) => t.id === selectedType)?.label || 'Summary'}
              </h3>
              <p className="text-sm text-[--foreground-muted]">
                {SUMMARY_TYPES.find((t) => t.id === selectedType)?.description}
              </p>
            </div>
          </div>

          {currentSummary.status === 'loading' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="w-12 h-12 text-[--accent] spinner mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-[--foreground-muted]">Generating summary...</p>
              </div>
            </div>
          )}

          {currentSummary.status === 'error' && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400">{currentSummary.error || 'Failed to generate this summary'}</p>
            </div>
          )}

          {currentSummary.status === 'complete' && (
            <div
              className="summary-content max-w-none"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(currentSummary.summary),
              }}
            />
          )}
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

        {/* Info about parallel generation */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[--accent]/5 border border-[--accent]/20">
          <svg className="w-5 h-5 text-[--accent] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-[--foreground-muted]">
            All 5 summary formats will be generated simultaneously. Switch between them instantly after processing.
          </p>
        </div>
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
          <div className="flex items-center gap-4 mb-4">
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
              <p className="font-medium text-white">Generating all 5 summaries...</p>
              <p className="text-sm text-[--foreground-muted]">
                This may take a few minutes for longer episodes.
              </p>
            </div>
          </div>

          {/* Progress for each summary type */}
          <div className="space-y-2">
            {SUMMARY_TYPES.map((type) => {
              const summary = summaries[type.id];
              return (
                <div key={type.id} className="flex items-center gap-3 text-sm">
                  {getStatusIcon(summary.status)}
                  <span className={summary.status === 'complete' ? 'text-white' : 'text-[--foreground-muted]'}>
                    {type.label}
                  </span>
                  {summary.status === 'complete' && (
                    <span className="text-green-400 text-xs">Ready</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Apply inline formatting (bold, italic) to text
 */
function formatInline(text: string): string {
  return text
    // Bold: **text** - use .+? to ensure at least one character
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* - but not if preceded/followed by another asterisk
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
}

/**
 * Simple markdown to HTML converter for the summary display
 */
function formatMarkdown(text: string): string {
  // First, process tables separately to avoid line break issues
  let processed = text;

  // Collect table blocks and process them
  const tableBlocks: string[] = [];
  processed = processed.replace(/((?:^\|.+\|$\n?)+)/gim, (match) => {
    const rows = match.trim().split('\n');
    let tableHtml = '<table>';
    let isFirstDataRow = true;

    for (const row of rows) {
      const rawCells = row
        .split('|')
        .filter((cell) => cell.trim() !== '')
        .map((cell) => cell.trim());

      // Skip separator rows (like |---|---|)
      if (rawCells.every((cell) => /^[-:]+$/.test(cell))) {
        continue;
      }

      // Apply inline formatting to cell content
      const cells = rawCells.map((cell) => formatInline(cell));

      // First row is header
      if (isFirstDataRow) {
        tableHtml += `<thead><tr>${cells.map((cell) => `<th>${cell}</th>`).join('')}</tr></thead><tbody>`;
        isFirstDataRow = false;
      } else {
        tableHtml += `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
      }
    }

    tableHtml += '</tbody></table>';
    const placeholder = `__TABLE_${tableBlocks.length}__`;
    tableBlocks.push(tableHtml);
    return placeholder;
  });

  // Now process the rest of the markdown
  processed = processed
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr>')
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* (but not **text**)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
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
    // Line breaks - but not multiple consecutive ones
    .replace(/\n{3,}/g, '\n\n') // Collapse 3+ newlines to 2
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Wrap in paragraphs
    .replace(/^([\s\S]*)$/, '<p>$1</p>')
    // Clean up empty paragraphs and unwrap block elements
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-3]>)/g, '$1')
    .replace(/(<\/h[1-3]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1')
    .replace(/<p>(<blockquote>)/g, '$1')
    .replace(/(<\/blockquote>)<\/p>/g, '$1')
    .replace(/<p>(<hr>)/g, '$1')
    .replace(/(<hr>)<\/p>/g, '$1')
    // Clean up around table placeholders
    .replace(/<p>(__TABLE_\d+__)/g, '$1')
    .replace(/(__TABLE_\d+__)<\/p>/g, '$1')
    .replace(/<br>(__TABLE_\d+__)/g, '$1')
    .replace(/(__TABLE_\d+__)<br>/g, '$1')
    // Clean up excessive breaks inside/around lists
    .replace(/<\/li><br><li/g, '</li><li')
    .replace(/<\/li><br><br><li/g, '</li><li')
    .replace(/<ul><br>/g, '<ul>')
    .replace(/<br><\/ul>/g, '</ul>')
    .replace(/<\/ul><br><br>/g, '</ul>');

  // Restore tables
  tableBlocks.forEach((table, index) => {
    processed = processed.replace(`__TABLE_${index}__`, table);
  });

  return processed;
}
