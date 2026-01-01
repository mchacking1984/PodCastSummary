import { GoogleGenerativeAI, Part } from '@google/generative-ai';

export type SummaryType =
  | 'quick'
  | 'key-takeaways'
  | 'critical-analysis'
  | 'comprehensive'
  | 'action-items'
  | 'executive'
  | 'discussion-questions';

export interface SummaryTypeInfo {
  id: SummaryType;
  label: string;
  description: string;
}

export const SUMMARY_TYPES: SummaryTypeInfo[] = [
  {
    id: 'quick',
    label: 'Quick Summary',
    description: '2-minute read covering the main points',
  },
  {
    id: 'key-takeaways',
    label: 'Key Takeaways',
    description: 'Bullet-point list of the most important learnings',
  },
  {
    id: 'critical-analysis',
    label: 'Critical Analysis',
    description: 'Analyzes strengths, weaknesses, and potential biases',
  },
  {
    id: 'comprehensive',
    label: 'Comprehensive Analysis',
    description: 'Deep dive with full context and detailed breakdown',
  },
  {
    id: 'action-items',
    label: 'Action Items',
    description: 'Practical steps and tips you can apply',
  },
  {
    id: 'executive',
    label: 'Executive Summary',
    description: 'Business-focused brief for quick decisions',
  },
  {
    id: 'discussion-questions',
    label: 'Discussion Questions',
    description: 'Thought-provoking questions for groups or reflection',
  },
];

const SUMMARY_PROMPTS: Record<SummaryType, string> = {
  'quick': `Please provide a concise summary of this podcast episode that can be read in about 2 minutes.
Cover the main topic, key points discussed, and the overall conclusion or takeaway.
Keep it informative but brief, focusing on what a listener would most want to know.`,

  'key-takeaways': `Please extract the key takeaways from this podcast episode as a bullet-point list.
Focus on:
- Main insights and learnings
- Important facts or statistics mentioned
- Notable quotes or ideas
- Actionable advice given
Present each takeaway as a clear, standalone point that provides value even without full context.`,

  'critical-analysis': `Please provide a critical analysis of this podcast episode. Include:

**Main Arguments/Claims**: What are the core arguments or claims made?

**Strengths**: What does the episode do well? What evidence or reasoning is compelling?

**Weaknesses**: Are there gaps in logic, missing perspectives, or unsupported claims?

**Potential Biases**: Consider the speakers' backgrounds, sponsorships, or perspectives that might influence the content.

**Overall Assessment**: How valuable and reliable is this content for the intended audience?`,

  'comprehensive': `Please provide a comprehensive analysis of this podcast episode:

**Overview**: What is this episode about and who are the speakers?

**Context**: What background knowledge is helpful to understand this episode?

**Detailed Breakdown**: Go through the major segments and topics covered, explaining each in detail.

**Key Insights**: What are the most important ideas or revelations?

**Supporting Evidence**: What examples, data, or stories were used?

**Conclusions**: What conclusions were reached?

**Relevance**: Why does this matter and who would benefit from this content?`,

  'action-items': `Please extract practical, actionable items from this podcast episode.

For each action item:
- State the specific action clearly
- Explain why it's recommended
- Note any prerequisites or considerations
- Indicate difficulty level or time investment if mentioned

Focus on things the listener can actually DO based on the advice given.
Organize by priority or category if appropriate.`,

  'executive': `Please provide an executive summary of this podcast episode suitable for busy professionals:

**Bottom Line**: The single most important takeaway (1-2 sentences)

**Key Points**: 3-5 bullet points covering essential information

**Relevance**: Who should care about this and why

**Recommended Action**: What, if anything, should be done based on this information

Keep the entire summary under 300 words. Be direct and focus on business or practical value.`,

  'discussion-questions': `Please generate thoughtful discussion questions based on this podcast episode.

Create questions that:
- Encourage deeper thinking about the topics covered
- Challenge assumptions or explore different perspectives
- Connect the content to broader themes or personal experience
- Are suitable for book clubs, study groups, or personal reflection

Provide 8-10 questions, ranging from straightforward comprehension to more philosophical or applied questions.
For each question, briefly note what aspect of the episode it relates to.`,
};

/**
 * Fetches audio and converts to base64 for Gemini
 */
async function fetchAudioAsBase64(audioUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(audioUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'audio/mpeg';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  // Map common content types to Gemini-supported types
  let mimeType = contentType.split(';')[0].trim();
  if (mimeType === 'audio/x-m4a') {
    mimeType = 'audio/mp4';
  }

  return { base64, mimeType };
}

/**
 * Generates a summary of the podcast using Gemini
 */
export async function generatePodcastSummary(
  audioUrl: string,
  episodeTitle: string,
  podcastName: string,
  summaryType: SummaryType
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Use Gemini 2.0 Flash for cost efficiency and audio support
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  // Fetch and encode the audio
  const { base64, mimeType } = await fetchAudioAsBase64(audioUrl);

  const audioPart: Part = {
    inlineData: {
      mimeType,
      data: base64,
    },
  };

  const prompt = `You are analyzing a podcast episode.

Podcast: ${podcastName}
Episode: ${episodeTitle}

${SUMMARY_PROMPTS[summaryType]}

Please listen to the audio and provide your response in well-formatted markdown.`;

  const result = await model.generateContent([prompt, audioPart]);
  const response = await result.response;
  const text = response.text();

  if (!text) {
    throw new Error('No summary generated');
  }

  return text;
}
