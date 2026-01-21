import Parser from 'rss-parser';

export interface PodcastEpisode {
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  pubDate: string;
  podcastName: string;
  artworkUrl: string;
}

interface iTunesLookupResult {
  resultCount: number;
  results: Array<{
    collectionName: string;
    feedUrl: string;
    artworkUrl600: string;
    trackName?: string;
    wrapperType?: string;
  }>;
}

/**
 * Extracts podcast ID and episode ID from an Apple Podcasts URL
 * Supports formats:
 * - https://podcasts.apple.com/us/podcast/episode-name/id123456789?i=1000123456789
 * - https://podcasts.apple.com/podcast/id123456789?i=1000123456789
 */
export function parseApplePodcastUrl(url: string): { podcastId: string; episodeId: string | null } {
  const urlObj = new URL(url);

  // Extract podcast ID from path (e.g., /id123456789 or /podcast-name/id123456789)
  const pathMatch = urlObj.pathname.match(/id(\d+)/);
  if (!pathMatch) {
    throw new Error('Could not find podcast ID in URL. Please provide a valid Apple Podcasts URL.');
  }

  const podcastId = pathMatch[1];

  // Extract episode ID from query parameter (e.g., ?i=1000123456789)
  const episodeId = urlObj.searchParams.get('i');

  return { podcastId, episodeId };
}

/**
 * Fetches podcast feed URL from iTunes API
 */
export async function getPodcastFeedUrl(podcastId: string): Promise<{ feedUrl: string; podcastName: string; artworkUrl: string }> {
  const lookupUrl = `https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`;

  const response = await fetch(lookupUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch podcast information from iTunes');
  }

  const data: iTunesLookupResult = await response.json();

  if (data.resultCount === 0 || !data.results[0]) {
    throw new Error('Podcast not found. Please check the URL and try again.');
  }

  const podcast = data.results[0];

  if (!podcast.feedUrl) {
    throw new Error('This podcast does not have a public RSS feed available.');
  }

  return {
    feedUrl: podcast.feedUrl,
    podcastName: podcast.collectionName,
    artworkUrl: podcast.artworkUrl600,
  };
}

/**
 * Fetches episode details from iTunes API by episode ID
 */
export async function getEpisodeDetailsFromiTunes(episodeId: string): Promise<{ title: string } | null> {
  try {
    const lookupUrl = `https://itunes.apple.com/lookup?id=${episodeId}`;
    const response = await fetch(lookupUrl);

    if (!response.ok) {
      return null;
    }

    const data: iTunesLookupResult = await response.json();

    if (data.resultCount === 0 || !data.results[0]) {
      return null;
    }

    const episode = data.results[0];
    if (episode.trackName) {
      return { title: episode.trackName };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch episode details from iTunes:', error);
    return null;
  }
}

/**
 * Parses RSS feed and finds the specific episode
 */
export async function getEpisodeFromFeed(
  feedUrl: string,
  episodeId: string | null,
  podcastName: string,
  artworkUrl: string
): Promise<PodcastEpisode> {
  const parser = new Parser({
    customFields: {
      item: [
        ['itunes:duration', 'duration'],
        ['enclosure', 'enclosure'],
      ],
    },
  });

  // Fetch the feed with a timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PodcastSummary/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch podcast feed');
    }

    const feedText = await response.text();
    const feed = await parser.parseString(feedText);

    if (!feed.items || feed.items.length === 0) {
      throw new Error('No episodes found in podcast feed');
    }

    let episode;

    if (episodeId) {
      // First, try to get episode title from iTunes API
      const itunesEpisode = await getEpisodeDetailsFromiTunes(episodeId);

      if (itunesEpisode?.title) {
        // Match by title (normalized for comparison)
        const normalizeTitle = (title: string) => title.toLowerCase().trim();
        const targetTitle = normalizeTitle(itunesEpisode.title);

        episode = feed.items.find((item) => {
          const itemTitle = normalizeTitle(item.title || '');
          return itemTitle === targetTitle || itemTitle.includes(targetTitle) || targetTitle.includes(itemTitle);
        });

        if (episode) {
          console.log('Found episode by title match:', episode.title);
        }
      }

      // If not found by title, try to find by ID in the guid
      if (!episode) {
        episode = feed.items.find((item) => {
          const guid = item.guid || '';
          return guid.includes(episodeId) || guid.endsWith(episodeId);
        });
      }

      // If still not found, fall back to most recent episode with a warning
      if (!episode) {
        console.warn('Could not find specific episode, using most recent');
        episode = feed.items[0];
      }
    } else {
      // No episode ID specified, use most recent
      episode = feed.items[0];
    }

    // Extract audio URL from enclosure
    const enclosure = episode.enclosure as { url?: string } | undefined;
    const audioUrl = enclosure?.url || '';

    if (!audioUrl) {
      throw new Error('Could not find audio URL for this episode');
    }

    return {
      title: episode.title || 'Unknown Episode',
      description: episode.contentSnippet || episode.content || '',
      audioUrl,
      duration: (episode as { duration?: string }).duration || 'Unknown',
      pubDate: episode.pubDate || '',
      podcastName,
      artworkUrl,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out while fetching podcast feed');
    }
    throw error;
  }
}

/**
 * Main function to get episode details from an Apple Podcasts URL
 */
export async function getEpisodeFromAppleUrl(url: string): Promise<PodcastEpisode> {
  const { podcastId, episodeId } = parseApplePodcastUrl(url);
  const { feedUrl, podcastName, artworkUrl } = await getPodcastFeedUrl(podcastId);
  const episode = await getEpisodeFromFeed(feedUrl, episodeId, podcastName, artworkUrl);

  return episode;
}
