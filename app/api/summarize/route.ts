import { NextRequest, NextResponse } from 'next/server';
import { getEpisodeFromAppleUrl, PodcastEpisode } from '@/lib/apple-podcasts';
import { generatePodcastSummary, SummaryType, SUMMARY_TYPES } from '@/lib/gemini';

export const maxDuration = 300; // 5 minutes for audio processing

interface SummarizeRequest {
  url: string;
  summaryType: SummaryType;
}

interface SummarizeResponse {
  success: boolean;
  episode?: PodcastEpisode;
  summary?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SummarizeResponse>> {
  try {
    const body: SummarizeRequest = await request.json();
    const { url, summaryType } = body;

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
    console.log('Generating summary...');
    const summary = await generatePodcastSummary(
      episode.audioUrl,
      episode.title,
      episode.podcastName,
      summaryType
    );
    console.log('Summary generated successfully');

    return NextResponse.json({
      success: true,
      episode,
      summary,
    });
  } catch (error) {
    console.error('Error processing podcast:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred. Please try again.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
