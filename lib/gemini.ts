import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Gemini Model Options
export type GeminiModel =
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-3-flash-preview'
  | 'gemini-3-pro-preview';

export interface GeminiModelInfo {
  id: GeminiModel;
  label: string;
  description: string;
  costTier: 'low' | 'medium' | 'high';
}

export const GEMINI_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: 'Fastest & most affordable option',
    costTier: 'low',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Fast & cost-effective (recommended)',
    costTier: 'low',
  },
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    description: 'Latest fast model with 1M context',
    costTier: 'low',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Higher quality, detailed analysis',
    costTier: 'medium',
  },
  {
    id: 'gemini-3-pro-preview',
    label: 'Gemini 3 Pro',
    description: 'Most capable with 1M context window',
    costTier: 'high',
  },
];

export type SummaryType =
  | 'executive-briefing'
  | 'alpha-takeaways'
  | 'actionable-insights'
  | 'opposing-viewpoints'
  | 'chronological-roadmap';

export interface SummaryTypeInfo {
  id: SummaryType;
  label: string;
  description: string;
}

export const SUMMARY_TYPES: SummaryTypeInfo[] = [
  {
    id: 'executive-briefing',
    label: 'Executive Briefing',
    description: 'The TL;DR — 30-second high-level overview',
  },
  {
    id: 'alpha-takeaways',
    label: 'Alpha & Key Takeaways',
    description: 'Core arguments with supporting evidence',
  },
  {
    id: 'actionable-insights',
    label: 'Actionable Insights',
    description: 'Step-by-step guide and next steps',
  },
  {
    id: 'opposing-viewpoints',
    label: 'Opposing Viewpoints',
    description: 'Debate mode — balanced Side A vs Side B',
  },
  {
    id: 'chronological-roadmap',
    label: 'Chronological Roadmap',
    description: 'Timestamped table of contents',
  },
];

const SUMMARY_PROMPTS: Record<SummaryType, string> = {
  'executive-briefing': `You are creating an "Executive Briefing" - the TL;DR for busy professionals. Answer: "If I only have 30 seconds, what do I need to know?"

Best for: Daily news, market updates, and political briefings.

Format your response EXACTLY like this:

## 📊 Executive Briefing

**THE BOTTOM LINE**

[Write ONE punchy, compelling paragraph (3-4 sentences max) that captures the essence of this episode. Be direct and impactful. This should tell someone everything they need to know if they only read this.]

---

**KEY TAKEAWAYS**

| # | Takeaway |
|---|----------|
| 1 | [First major point - be specific and actionable] |
| 2 | [Second major point] |
| 3 | [Third major point] |
| 4 | [Fourth major point, if applicable] |
| 5 | [Fifth major point, if applicable] |

---

**VERDICT**: [One sentence: Is this episode worth the full listen? For whom?]

Keep this punchy and scannable. No fluff. Every word must earn its place.`,

  'alpha-takeaways': `You are creating an "Alpha & Key Takeaways" summary - focusing on unique insights and the "edge" that makes this episode valuable. In investing, "Alpha" is the unique insight that leads to profit.

Best for: Investment theses, economic analysis, and policy deep-dives.

Format your response EXACTLY like this:

## 🎯 Alpha & Key Takeaways

### The Core Thesis
[2-3 sentences summarizing the main argument or insight presented]

---

### Main Arguments

| Argument | Supporting Evidence |
|----------|-------------------|
| [Key claim #1] | [Data, example, or reasoning provided] |
| [Key claim #2] | [Data, example, or reasoning provided] |
| [Key claim #3] | [Data, example, or reasoning provided] |
| [Continue as needed...] | |

---

### Data Points & Evidence

**Numbers Mentioned:**
- [Specific statistic, ticker, rate, or metric #1]
- [Specific statistic, ticker, rate, or metric #2]
- [Continue with all quantitative data...]

**Sources Cited:**
- [Research, reports, or authorities referenced]

---

### The "Alpha" — Unique Insights

> [The single most valuable or contrarian insight from this episode that you won't hear elsewhere]

**Why This Matters:** [1-2 sentences on the practical implications]

---

### Credibility Check
- **Speaker's Track Record:** [Brief note on their expertise/credentials]
- **Potential Blind Spots:** [Any biases or limitations to consider]

Focus on isolating the "meat" of the conversation that can be cited or used in research.`,

  'actionable-insights': `You are creating an "Actionable Insights & Next Steps" summary - a practical playbook. Filter out the theory and focus entirely on the "How-To."

Best for: Personal finance, strategy sessions, and calls to action.

Format your response EXACTLY like this:

## ✅ Actionable Insights & Next Steps

### Why This Matters To You
[2-3 sentences explaining the real-world impact and why taking action is important]

---

### Your Action Checklist

**Immediate Actions (Do This Week)**
- [ ] [Specific, concrete step #1]
- [ ] [Specific, concrete step #2]
- [ ] [Specific, concrete step #3]

**Short-Term Actions (Next 30 Days)**
- [ ] [Action item #1]
- [ ] [Action item #2]
- [ ] [Action item #3]

**Long-Term Considerations**
- [ ] [Strategic action #1]
- [ ] [Strategic action #2]

---

### Step-by-Step Guide

| Step | Action | Details |
|------|--------|---------|
| 1 | [Action verb + task] | [Specific instructions or considerations] |
| 2 | [Action verb + task] | [Specific instructions or considerations] |
| 3 | [Action verb + task] | [Specific instructions or considerations] |
| [Continue...] | | |

---

### Resources Needed
- **Tools:** [Any software, apps, or resources mentioned]
- **Information:** [What you need to research or gather]
- **Contacts:** [People or organizations to reach out to]

---

### Watch Out For
⚠️ [Common pitfall or mistake to avoid #1]
⚠️ [Common pitfall or mistake to avoid #2]

---

### Success Metric
**How will you know it worked?** [Specific outcome or measurement]

Transform passive listening into active participation. Every item should be something the listener can DO.`,

  'opposing-viewpoints': `You are creating an "Opposing Viewpoints" summary (Debate Mode) - explicitly identifying different perspectives. Finance and politics are rarely one-sided.

Best for: Political debates, "Bull vs. Bear" market cases, and controversial policy discussions.

Format your response EXACTLY like this:

## ⚔️ Opposing Viewpoints

### The Central Debate
**Topic:** [What specific issue or question is being debated?]

**The Stakes:** [Why does this matter? What are the implications?]

---

### Side-by-Side Comparison

| Aspect | 🔵 Position A | 🔴 Position B |
|--------|--------------|--------------|
| **Core Belief** | [Fundamental premise] | [Fundamental premise] |
| **Main Argument** | [Primary reasoning] | [Primary reasoning] |
| **Key Evidence** | [Data/examples cited] | [Data/examples cited] |
| **Predicted Outcome** | [What they expect] | [What they expect] |
| **Risks Identified** | [Concerns raised] | [Concerns raised] |

---

### 🔵 Position A: [Label/Speaker Name]

**The Steel-Manned Argument:**
[Present this position in its STRONGEST possible form - 2-3 sentences]

**Supporting Points:**
1. [Strongest argument #1]
2. [Strongest argument #2]
3. [Strongest argument #3]

**Evidence Cited:** [Specific data, studies, or examples]

---

### 🔴 Position B: [Label/Speaker Name]

**The Steel-Manned Argument:**
[Present this position in its STRONGEST possible form - 2-3 sentences]

**Supporting Points:**
1. [Strongest argument #1]
2. [Strongest argument #2]
3. [Strongest argument #3]

**Evidence Cited:** [Specific data, studies, or examples]

---

### 🤝 Common Ground
[Where do both sides actually agree? What shared values or assumptions exist?]

### ❓ Unresolved Questions
- [Key question left unanswered #1]
- [Key question left unanswered #2]

### 🎯 The Listener's Takeaway
[Help the listener form their own view - what should they consider?]

Present each side fairly and as strongly as possible (steelman approach). Avoid echo chambers.`,

  'chronological-roadmap': `You are creating a "Chronological Roadmap" - an interactive table of contents with timestamps, turning a long podcast into a searchable reference document.

Best for: Long-form interviews (2+ hours) and multi-topic shows.

Format your response EXACTLY like this:

## 🗺️ Chronological Roadmap

### Episode Overview
**Total Length:** [Approximate duration]
**Format:** [Interview / Panel / Monologue / etc.]
**Main Theme:** [One sentence describing the overarching topic]

---

### Quick Navigation

| Timestamp | Topic | Key Point |
|-----------|-------|-----------|
| [~00:00] | [Topic title] | [One-line summary] |
| [~XX:XX] | [Topic title] | [One-line summary] |
| [~XX:XX] | [Topic title] | [One-line summary] |
| [Continue for all segments...] | | |

---

### Detailed Chapter Breakdown

#### 📍 [~00:00 - ~XX:XX] — [Chapter Title]
**Topics Covered:** [List key subjects discussed]
**Key Quote:** "[Most memorable quote from this section]"
**Summary:** [2-3 sentence summary of this segment]

---

#### 📍 [~XX:XX - ~XX:XX] — [Chapter Title]
**Topics Covered:** [List key subjects discussed]
**Key Quote:** "[Most memorable quote from this section]"
**Summary:** [2-3 sentence summary of this segment]

---

[Continue for all major segments, breaking into 10-15 minute chunks]

---

### Highlight Moments

| Timestamp | Moment | Why It Matters |
|-----------|--------|----------------|
| [~XX:XX] | [Brief description] | [Significance] |
| [~XX:XX] | [Brief description] | [Significance] |
| [~XX:XX] | [Brief description] | [Significance] |

---

### Skip To...
- **Want the main insight?** Jump to [~XX:XX]
- **Looking for actionable advice?** Start at [~XX:XX]
- **Interested in [specific topic]?** See [~XX:XX]

Make timestamps approximate based on the conversation flow. Make this navigable and searchable.`,
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
  modelId: GeminiModel = 'gemini-2.5-flash'
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
