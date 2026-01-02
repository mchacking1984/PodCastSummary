import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Gemini Model Options
export type GeminiModel =
  | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-2.0-flash-thinking-exp';

export interface GeminiModelInfo {
  id: GeminiModel;
  label: string;
  description: string;
  costTier: 'low' | 'medium' | 'high';
}

export const GEMINI_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-2.0-flash-exp',
    label: 'Gemini 2.0 Flash',
    description: 'Fast & cost-effective (recommended)',
    costTier: 'low',
  },
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    description: 'Stable, great for most podcasts',
    costTier: 'low',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    description: 'Higher quality, more detailed analysis',
    costTier: 'medium',
  },
  {
    id: 'gemini-2.0-flash-thinking-exp',
    label: 'Gemini 2.0 Thinking',
    description: 'Best for complex analysis (experimental)',
    costTier: 'high',
  },
];

export type SummaryType =
  | 'quick-read'
  | 'deep-dive'
  | 'key-learnings'
  | 'critical-analysis'
  | 'mentioned-resources'
  | 'executive-memo'
  | 'debate-tracker'
  | 'story-map'
  | 'glossary'
  | 'networker-cheat-sheet';

export interface SummaryTypeInfo {
  id: SummaryType;
  label: string;
  description: string;
}

export const SUMMARY_TYPES: SummaryTypeInfo[] = [
  {
    id: 'quick-read',
    label: 'Quick Read',
    description: 'The 2-minute brief for watercooler conversations',
  },
  {
    id: 'deep-dive',
    label: 'Deep Dive',
    description: 'Comprehensive recap with timestamps and chapters',
  },
  {
    id: 'key-learnings',
    label: 'Key Learnings',
    description: 'Action-oriented summary with checklists',
  },
  {
    id: 'critical-analysis',
    label: 'Critical Analysis',
    description: 'Thought partner with counterpoints and context',
  },
  {
    id: 'mentioned-resources',
    label: 'Mentioned Resources',
    description: 'Bibliography of books, tools, and links',
  },
  {
    id: 'executive-memo',
    label: 'Executive Memo',
    description: 'Strategic overview for decision-makers',
  },
  {
    id: 'debate-tracker',
    label: 'Debate Tracker',
    description: 'Steelman summary mapping different perspectives',
  },
  {
    id: 'story-map',
    label: 'Story Map',
    description: 'Narrative arc for story-driven episodes',
  },
  {
    id: 'glossary',
    label: 'Glossary & Concepts',
    description: 'Explainer for technical or jargon-heavy episodes',
  },
  {
    id: 'networker-cheat-sheet',
    label: "Networker's Cheat Sheet",
    description: 'Relationship guide for people and entities mentioned',
  },
];

const SUMMARY_PROMPTS: Record<SummaryType, string> = {
  'quick-read': `You are creating a "Quick Read" summary - the watercooler version so someone can talk about the episode without listening to the whole thing.

Format your response EXACTLY like this:

## 💡 The Big Idea
[One bold sentence summarizing the episode's core message]

## 🎯 Top 3 Takeaways
- [Most important fact or story #1]
- [Most important fact or story #2]
- [Most important fact or story #3]

## 🎭 The Vibe
**[1-2 word descriptor]** (e.g., Inspirational, Technical, Controversial, Thought-Provoking, Entertaining)

---
*Reading time: ~2 minutes*

IMPORTANT: Keep this strictly under 150 words total. Be punchy and direct.`,

  'deep-dive': `You are creating a "Deep Dive" summary - a comprehensive recap that replaces the need to take notes. This is for the "student" listener who wants to reference specific details later.

Format your response like this:

## 📋 Episode Overview
[2-3 sentence overview of what this episode covers]

## 📑 Chapter Breakdown

### [00:00 - ~XX:XX] [Chapter Title]
[2-3 paragraph narrative summary of this segment. Include specific details, names mentioned, and key points discussed.]

### [~XX:XX - ~XX:XX] [Chapter Title]
[Continue with next segment...]

[Continue for all major segments, breaking the episode into 10-15 minute chunks]

## 🔍 Expanded Details
- **Names Mentioned**: [List people referenced with brief context]
- **Data Points**: [Specific statistics or numbers mentioned]
- **Historical Context**: [Any background information provided]

## 🎬 Key Moments
[List 3-5 standout moments with approximate timestamps]

Make the timestamps approximate based on the flow of conversation. Be thorough and detailed.`,

  'key-learnings': `You are creating a "Key Learnings" summary - focused on utility and action. This format works best for business, self-improvement, or "How-To" content.

Format your response EXACTLY like this:

## 🤔 The "So What?"
[2-3 sentences explaining why this information matters to the listener and how it could impact their life/work]

## ✅ Action Checklist
- [ ] [Specific actionable step #1]
- [ ] [Specific actionable step #2]
- [ ] [Specific actionable step #3]
- [ ] [Continue as needed...]

## 💎 The Golden Quote
> "[The single most impactful quote that encapsulates the lesson]"
> — [Speaker name]

## 📝 Supporting Insights
[Bullet points of additional learnings that support the main actions]

Focus on turning advice into concrete, actionable items the listener can implement immediately.`,

  'critical-analysis': `You are creating a "Critical Analysis" - providing context and "reading between the lines." This format helps listeners think critically about the content.

Format your response like this:

## 🎯 The Core Argument
[What is the main thesis or argument being presented? Summarize in 2-3 sentences]

## ⚖️ Analysis Table

| Speaker's Point | Context & Consideration |
|----------------|------------------------|
| [Claim #1] | [Supporting data, caveats, or alternative perspective] |
| [Claim #2] | [Supporting data, caveats, or alternative perspective] |
| [Continue...] | |

## 🔄 Counterpoints
[What perspectives were NOT represented? What opposing arguments exist? Be fair and balanced.]

## ❓ Questions Left Unanswered
- [Important question the episode didn't address]
- [Continue as needed...]

## 📚 Further Exploration
- **Supporting**: [Books, articles, or sources that support the claims]
- **Challenging**: [Sources that offer alternative viewpoints]

## 🎚️ Overall Assessment
[Your balanced assessment of the episode's value, credibility, and who would benefit most from it]`,

  'mentioned-resources': `You are creating a "Mentioned Resources" bibliography - a quick-reference directory for everything mentioned during the episode.

Format your response EXACTLY like this:

## 📚 Books & Reading
| Title | Author | Context |
|-------|--------|---------|
| [Book name] | [Author] | [Why it was mentioned] |
| [Continue...] | | |

## 🔧 Tools & Apps
| Name | Type | Purpose |
|------|------|---------|
| [Tool name] | [Software/App/Service] | [What it does] |
| [Continue...] | | |

## 🔗 Websites & Articles
- [Resource name](URL if mentioned) - [Brief description]
- [Continue...]

## 👤 People Mentioned
| Name | Role/Title | Connection |
|------|-----------|------------|
| [Person name] | [Their title/role] | [Why they were mentioned] |
| [Continue...] | | |

## 🏢 Companies & Organizations
- **[Company name]**: [What they do and why mentioned]
- [Continue...]

## 🎬 Media & Entertainment
- [Movies, podcasts, shows, or other media mentioned]

If a URL wasn't explicitly mentioned, don't make one up. Only include items actually discussed in the episode.`,

  'executive-memo': `You are creating an "Executive Memo" - a high-level strategic overview for professionals who need to know the "bottom line" impacts.

Format your response EXACTLY like this:

## 📊 EXECUTIVE SUMMARY

**Bottom Line:** [One sentence with the single most important takeaway]

---

## 🎯 Strategic Impact
**Market Shift:** [How this topic affects the current market or industry landscape]

**Competitive Implications:** [What this means for businesses in the space]

---

## ⚡ Opportunities & Risks

| Opportunities | Risks |
|--------------|-------|
| [Opportunity #1] | [Risk #1] |
| [Opportunity #2] | [Risk #2] |
| [Continue...] | |

---

## 📈 Key Metrics & Data Points
- **[Metric]**: [Number/data point and its significance]
- [Continue with any KPIs or statistics mentioned...]

---

## 🎬 Recommended Action
[1-2 sentences on what a decision-maker should DO based on this information]

**Priority Level:** [High/Medium/Low]
**Relevance To:** [Which roles or industries should pay attention]

Keep the entire memo scannable. Use bold lead-ins for every paragraph to allow ultra-fast skimming.`,

  'debate-tracker': `You are creating a "Debate Tracker" - a steelman summary that maps out the intellectual landscape when there are differing opinions.

Format your response like this:

## 🎯 Point of Contention
[What specific topic or question is being debated?]

---

## 🔵 Perspective A: [Speaker/Position Name]

**Core Argument:**
[Their main thesis in 2-3 sentences]

**Strongest Points:**
- [Their most compelling argument #1]
- [Their most compelling argument #2]
- [Continue...]

**Evidence Cited:**
[What data, examples, or sources did they reference?]

---

## 🔴 Perspective B: [Speaker/Position Name]

**Core Argument:**
[Their main thesis in 2-3 sentences]

**Strongest Points:**
- [Their most compelling argument #1]
- [Their most compelling argument #2]
- [Continue...]

**Evidence Cited:**
[What data, examples, or sources did they reference?]

---

## 🤝 Common Ground
[Where did they actually agree? What shared assumptions or values were evident?]

## ❓ Unresolved Questions
[What was left unresolved or requires further discussion?]

If there are more than 2 perspectives, add additional sections. Present each side fairly and as strongly as possible (steelman approach).`,

  'story-map': `You are creating a "Story Map" - a narrative arc summary for story-driven episodes (true crime, history, memoir, investigative journalism).

Format your response like this:

## 🎭 The Setup

**Setting:** [When and where does this story take place?]

**Key Characters:**
| Character | Role | Description |
|-----------|------|-------------|
| [Name] | [Protagonist/Witness/etc.] | [Brief description] |
| [Continue...] | | |

**The World Before:** [What was the status quo before the main events?]

---

## 📍 Timeline of Events

**1. [Date/Time Period] - [Event Title]**
[Description of what happened and why it matters]

**2. [Date/Time Period] - [Event Title]**
[Description of what happened and why it matters]

**3. [Continue chronologically...]**

---

## ⚡ The Turning Point
[What was the pivotal moment that changed everything?]

## 🔍 Key Revelations
- [Important discovery or revelation #1]
- [Important discovery or revelation #2]
- [Continue...]

## 🎬 The Resolution
[How did the story end, or where does it stand now?]

## ❓ Open Questions
[What mysteries or questions remain unanswered?]

Use approximate dates/periods based on what's discussed. Focus on the narrative flow and emotional beats of the story.`,

  'glossary': `You are creating a "Glossary & Concept Breakdown" - an explainer for technical or jargon-heavy episodes.

Format your response like this:

## 📖 Key Terms & Definitions

### [Term 1]
**Definition:** [Clear, accessible definition]
**Used in context:** "[How it was used in the episode]"
**Why it matters:** [Real-world relevance]

### [Term 2]
**Definition:** [Clear, accessible definition]
**Used in context:** "[How it was used in the episode]"
**Why it matters:** [Real-world relevance]

[Continue for all significant technical terms...]

---

## 🎯 Core Concepts Explained

### [Concept Name]
**The Simple Version:** [Explain like I'm 5]
**The Analogy:** [How the speaker explained it, or create a helpful metaphor]
**The Full Picture:** [More detailed explanation for those who want depth]

[Continue for major concepts...]

---

## 🔗 How It All Connects
[A brief explanation of how these terms and concepts relate to each other]

## 💡 The "Why It Matters" Summary
[Translate all the technical content into real-world impact - what does this mean for regular people?]

Focus on making complex ideas accessible. Use the speaker's own analogies when possible.`,

  'networker-cheat-sheet': `You are creating a "Networker's Cheat Sheet" - a relationship guide to help listeners connect with people and entities mentioned.

Format your response like this:

## 🎤 Featured Guest

**Name:** [Guest's full name]
**Title:** [Current role/position]
**Known For:** [2-3 sentences on their background and expertise]

**Current Focus:** [What they're working on or promoting]
**The "Ask":** [What are they looking for? Hiring? Promoting a book? Building awareness?]

---

## 👥 People Mentioned

### [Person Name]
- **Who they are:** [Brief description]
- **Connection to guest:** [How they know the guest or why they were mentioned]
- **Notable for:** [What they're known for]

[Continue for each person mentioned...]

---

## 🏢 Organizations & Companies

### [Company/Org Name]
- **What they do:** [Brief description]
- **Why mentioned:** [Context for the reference]
- **Relevance:** [Why a listener might care]

[Continue for each organization...]

---

## 🔗 Connection Opportunities
[Suggestions for how a listener could engage with or learn more about these people/organizations - without fabricating URLs]

## 💬 Conversation Starters
[3-5 interesting talking points from the episode that could be used to engage with the guest or others in this space]

Only include verifiable information mentioned in the episode. Don't fabricate social media handles or URLs.`,
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
  summaryType: SummaryType,
  modelId: GeminiModel = 'gemini-2.0-flash-exp'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Use the selected Gemini model
  const model = genAI.getGenerativeModel({
    model: modelId,
  });

  // Fetch and encode the audio
  const { base64, mimeType } = await fetchAudioAsBase64(audioUrl);

  const audioPart: Part = {
    inlineData: {
      mimeType,
      data: base64,
    },
  };

  const prompt = `You are an expert podcast analyst creating a structured summary.

Podcast: ${podcastName}
Episode: ${episodeTitle}

${SUMMARY_PROMPTS[summaryType]}

Listen carefully to the entire audio and provide your response in well-formatted markdown. Be thorough and accurate.`;

  const result = await model.generateContent([prompt, audioPart]);
  const response = await result.response;
  const text = response.text();

  if (!text) {
    throw new Error('No summary generated');
  }

  return text;
}
