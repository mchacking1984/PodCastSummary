import { NextRequest, NextResponse } from 'next/server';
import { getEpisodeFromAppleUrl, PodcastEpisode } from '@/lib/apple-podcasts';
import { generatePodcastSummary, SummaryType, SUMMARY_TYPES, GeminiModel, GEMINI_MODELS } from '@/lib/gemini';
import { saveLog } from '@/lib/logger';

export const maxDuration = 300; // 5 minutes for audio processing

interface SummarizeRequest {
  url: string;
  summaryType: SummaryType;
  model: GeminiModel;
}

interface SummarizeResponse {
  success: boolean;
  episode?: PodcastEpisode;
  summary?: string;
  error?: string;
  model?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SummarizeResponse>> {
  try {
    const body: SummarizeRequest = await request.json();
    const { url, summaryType, model } = body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a podcast URL' },
        { status: 400 }
      );
    }

    // Validate summary type
    if (!summaryType || !SUMMARY_TYPES.find((t) => t.id === summaryType)) {
      return NextResponse.json(
        { success: false, error: 'Please select a valid summary type' },
        { status: 400 }
      );
    }

    // Validate model (default to gemini-2.5-flash if not provided)
    const selectedModel = model && GEMINI_MODELS.find((m) => m.id === model)
      ? model
      : 'gemini-2.5-flash';

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid URL' },
        { status: 400 }
      );
    }

    // Check if it's an Apple Podcasts URL
    if (!parsedUrl.hostname.includes('podcasts.apple.com')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide an Apple Podcasts URL (podcasts.apple.com)',
        },
        { status: 400 }
      );
    }

    // Get episode details from Apple Podcasts
    console.log('Fetching episode details...');
    const episode = await getEpisodeFromAppleUrl(url);
    console.log(`Found episode: ${episode.title}`);

    // Generate summary using Gemini
    console.log(`Generating summary with model: ${selectedModel}...`);
    const summary = await generatePodcastSummary(
      episode.audioUrl,
      episode.title,
      episode.podcastName,
      summaryType,
      selectedModel
    );
    console.log('Summary generated successfully');

    // Log successful request (don't await to avoid slowing response)
    saveLog({
      podcastName: episode.podcastName,
      episodeTitle: episode.title,
      model: selectedModel,
      summaryTypes: [summaryType],
      duration: episode.duration,
      success: true,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      episode,
      summary,
      model: selectedModel,
    });
  } catch (error) {
    console.error('Error processing podcast:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred. Please try again.';

    // Log failed request (we don't have access to request details in catch)
    saveLog({
      podcastName: 'Unknown',
      episodeTitle: 'Unknown',
      model: 'unknown',
      summaryTypes: ['unknown'],
      success: false,
      error: errorMessage,
    }).catch(console.error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
