import { NextRequest, NextResponse } from 'next/server';
import { getEpisodeFromAppleUrl, parseApplePodcastUrl } from '@/lib/apple-podcasts';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Parse the URL to get IDs
    const { podcastId, episodeId } = parseApplePodcastUrl(url);

    // Get raw iTunes API response for the episode ID
    let itunesRawResponse = null;
    if (episodeId) {
      const lookupUrl = `https://itunes.apple.com/lookup?id=${episodeId}`;
      const response = await fetch(lookupUrl);
      itunesRawResponse = await response.json();
    }

    // Get the full episode details
    const episode = await getEpisodeFromAppleUrl(url);

    return NextResponse.json({
      success: true,
      debug: {
        podcastId,
        episodeId,
        itunesRawResponse,
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
