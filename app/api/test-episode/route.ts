import { NextRequest, NextResponse } from 'next/server';
import { getEpisodeFromAppleUrl, parseApplePodcastUrl, getEpisodeDetailsFromiTunes } from '@/lib/apple-podcasts';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Parse the URL to get IDs
    const { podcastId, episodeId } = parseApplePodcastUrl(url);

    // Get iTunes episode info if we have an episode ID
    let itunesEpisodeTitle = null;
    if (episodeId) {
      const itunesEpisode = await getEpisodeDetailsFromiTunes(episodeId);
      itunesEpisodeTitle = itunesEpisode?.title || null;
    }

    // Get the full episode details
    const episode = await getEpisodeFromAppleUrl(url);

    return NextResponse.json({
      success: true,
      debug: {
        podcastId,
        episodeId,
        itunesEpisodeTitle,
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
