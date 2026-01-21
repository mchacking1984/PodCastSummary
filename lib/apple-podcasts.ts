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
 * Extracts podcast ID, episode ID, and episode slug from an Apple Podcasts URL
 * Supports formats:
 * - https://podcasts.apple.com/us/podcast/episode-name/id123456789?i=1000123456789
 * - https://podcasts.apple.com/podcast/id123456789?i=1000123456789
 */
export function parseApplePodcastUrl(url: string): { podcastId: string; episodeId: string | null; episodeSlug: string | null } {
  const urlObj = new URL(url);

  // Extract podcast ID from path (e.g., /id123456789 or /podcast-name/id123456789)
  const pathMatch = urlObj.pathname.match(/id(\d+)/);
  if (!pathMatch) {
    throw new Error('Could not find podcast ID in URL. Please provide a valid Apple Podcasts URL.');
  }

  const podcastId = pathMatch[1];

  // Extract episode ID from query parameter (e.g., ?i=1000123456789)
  const episodeId = urlObj.searchParams.get('i');

  // Extract episode slug from URL path
  // URL format: /us/podcast/episode-name-slug/id123456789
  // We want to get "episode-name-slug" which is the segment before "id..."
  let episodeSlug: string | null = null;
  const pathParts = urlObj.pathname.split('/').filter(Boolean);

  // Find the index of the id segment
  const idIndex = pathParts.findIndex(part => part.startsWith('id'));
  if (idIndex > 0) {
    // The segment before id is potentially the episode slug
    const potentialSlug = pathParts[idIndex - 1];
    // Make sure it's not "podcast" (which would mean no episode slug)
    if (potentialSlug && potentialSlug !== 'podcast') {
      episodeSlug = potentialSlug;
    }
  }

  return { podcastId, episodeId, episodeSlug };
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
    console.log('Looking up episode from iTunes:', lookupUrl);

    const response = await fetch(lookupUrl);
    console.log('iTunes API response status:', response.status);

    if (!response.ok) {
      console.error('iTunes API returned non-OK status:', response.status);
      return null;
    }

    const data: iTunesLookupResult = await response.json();
    console.log('iTunes API result count:', data.resultCount);

    if (data.resultCount === 0 || !data.results[0]) {
      console.log('No results from iTunes API');
      return null;
    }

    const episode = data.results[0];
    console.log('iTunes episode data:', JSON.stringify(episode, null, 2));

    if (episode.trackName) {
      console.log('Found episode title from iTunes:', episode.trackName);
      return { title: episode.trackName };
    }

    console.log('No trackName in iTunes response');
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
  episodeSlug: string | null,
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

    console.log('Episode ID from URL:', episodeId);
    console.log('Episode slug from URL:', episodeSlug);
    console.log('Total episodes in feed:', feed.items.length);

    // Helper to normalize text for comparison
    const normalizeForMatch = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ')        // Normalize spaces
        .trim();
    };

    // Convert slug to search terms (e.g., "how-to-make-money" -> "how to make money")
    const slugToWords = (slug: string) => {
      return slug.replace(/-/g, ' ').toLowerCase();
    };

    if (episodeSlug || episodeId) {
      // First, try to match by episode slug (most reliable)
      if (episodeSlug) {
        const slugWords = slugToWords(episodeSlug);
        console.log('Searching for episode with slug words:', slugWords);

        // Log first 5 episode titles from feed for debugging
        console.log('First 5 feed episode titles:', feed.items.slice(0, 5).map(i => i.title));

        episode = feed.items.find((item) => {
          const itemTitle = normalizeForMatch(item.title || '');
          const slugNormalized = normalizeForMatch(slugWords);

          // Check if all significant words from the slug are in the title
          const slugWordList = slugNormalized.split(' ').filter(w => w.length > 2);
          const matchScore = slugWordList.filter(word => itemTitle.includes(word)).length;
          const matchRatio = matchScore / slugWordList.length;

          // Require at least 80% of words to match
          return matchRatio >= 0.8;
        });

        if (episode) {
          console.log('Found episode by slug match:', episode.title);
        } else {
          console.log('No slug match found');
        }
      }

      // If not found by slug, try iTunes API lookup (fallback)
      if (!episode && episodeId) {
        const itunesEpisode = await getEpisodeDetailsFromiTunes(episodeId);
        console.log('iTunes episode lookup result:', itunesEpisode);

        if (itunesEpisode?.title) {
          const targetTitle = normalizeForMatch(itunesEpisode.title);
          console.log('Looking for iTunes title:', targetTitle);

          episode = feed.items.find((item) => {
            const itemTitle = normalizeForMatch(item.title || '');
            return itemTitle === targetTitle || itemTitle.includes(targetTitle) || targetTitle.includes(itemTitle);
          });

          if (episode) {
            console.log('Found episode by iTunes title match:', episode.title);
          }
        }
      }

      // If not found by title, try to find by ID in the guid
      if (!episode && episodeId) {
        console.log('Trying to match by guid...');
        episode = feed.items.find((item) => {
          const guid = item.guid || '';
          return guid.includes(episodeId) || guid.endsWith(episodeId);
        });
        if (episode) {
          console.log('Found episode by guid match:', episode.title);
        }
      }

      // If still not found, fall back to most recent episode with a warning
      if (!episode) {
        console.warn('Could not find specific episode, using most recent:', feed.items[0]?.title);
        episode = feed.items[0];
      }
    } else {
      // No episode ID or slug specified, use most recent
      console.log('No episode ID or slug in URL, using most recent');
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
  const { podcastId, episodeId, episodeSlug } = parseApplePodcastUrl(url);
  const { feedUrl, podcastName, artworkUrl } = await getPodcastFeedUrl(podcastId);
  const episode = await getEpisodeFromFeed(feedUrl, episodeId, episodeSlug, podcastName, artworkUrl);

  return episode;
}
