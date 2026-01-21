import { NextRequest, NextResponse } from 'next/server';
import { getEpisodeFromAppleUrl, parseApplePodcastUrl } from '@/lib/apple-podcasts';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Parse the URL to get IDs
    const { podcastId, episodeId, episodeSlug } = parseApplePodcastUrl(url);

    // Get the full episode details
    const episode = await getEpisodeFromAppleUrl(url);

    return NextResponse.json({
      success: true,
      debug: {
        podcastId,
        episodeId,
        episodeSlug,
        foundEpisodeTitle: episode.title,
        foundEpisodePubDate: episode.pubDate,
      },
      episode,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
