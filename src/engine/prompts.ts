import { Plan } from './types';

const SYSTEM_PROMPT = `You are Sumly, an expert AI video summarizer. You produce structured, professional summaries from YouTube video transcripts. Your summaries must contain SPECIFIC, CONCRETE information — real facts, numbers, strategies, and ideas from the video. Never be vague or generic. A reader should genuinely learn something from your summary without watching the video. Always respond with valid JSON matching the exact schema requested.`;

export function getSummaryPrompt(
  plan: Plan,
  transcript: string,
  videoDurationSeconds: number
): { system: string; user: string } {
  const user = buildUserPrompt(plan, transcript, videoDurationSeconds);
  return { system: SYSTEM_PROMPT, user };
}

function getLengthGuidance(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  if (minutes <= 5) return `This is a short video (~${minutes} min). Keep the summary concise and tight.`;
  if (minutes <= 15) return `This is a medium-length video (~${minutes} min). Provide a moderate level of detail.`;
  if (minutes <= 45) return `This is a longer video (~${minutes} min). Provide a thorough, detailed summary.`;
  if (minutes <= 90) return `This is a long video (~${minutes} min). Provide an extensive, comprehensive summary with significant detail.`;
  return `This is a very long video (~${minutes} min). Provide a very extensive and thorough summary. Cover all major topics in depth.`;
}

function getOverviewLength(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  if (minutes <= 5) return '2-3 sentences';
  if (minutes <= 15) return '3-5 sentences';
  if (minutes <= 45) return '5-7 sentences';
  if (minutes <= 90) return '7-10 sentences';
  return '10-12 sentences';
}

function getKeyPointCount(durationSeconds: number, plan: Plan): number {
  const minutes = Math.round(durationSeconds / 60);
  const base = minutes <= 5 ? 3 : minutes <= 15 ? 5 : minutes <= 45 ? 7 : minutes <= 90 ? 9 : 12;
  if (plan === 'basic') return Math.max(3, base - 1);
  if (plan === 'plus') return base + 1;
  return base + 2;
}

function getInsightCount(durationSeconds: number, plan: Plan): number {
  const minutes = Math.round(durationSeconds / 60);
  const base = minutes <= 5 ? 4 : minutes <= 15 ? 6 : minutes <= 45 ? 8 : minutes <= 90 ? 10 : 12;
  if (plan === 'plus') return base;
  return base + 2;
}

function getThemeCount(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  if (minutes <= 5) return '2-3';
  if (minutes <= 15) return '3-4';
  if (minutes <= 45) return '4-6';
  return '5-8';
}

function buildUserPrompt(plan: Plan, transcript: string, durationSeconds: number): string {
  const lengthGuide = getLengthGuidance(durationSeconds);
  const overviewLen = getOverviewLength(durationSeconds);
  const keyPoints = getKeyPointCount(durationSeconds, plan);

  switch (plan) {
    case 'basic':
      return `Summarize this YouTube video transcript. Return ONLY valid JSON with this exact structure:

{
  "type": "basic",
  "overview": "A clear, informative overview of the video content",
  "keyPoints": ["point 1", "point 2", ...]
}

${lengthGuide}

Rules:
- Overview must be ${overviewLen} and contain SPECIFIC information — mention actual topics, names, strategies, or ideas discussed
- Include exactly ${keyPoints} key points
- CRITICAL: Each key point must contain a specific fact, idea, strategy, or insight from the video. The reader should LEARN something concrete from each point
- BAD example: "The speaker discusses marketing strategies" (too vague, says nothing)
- GOOD example: "The speaker recommends building an email list before launching a product, as it consistently generates 3-5x higher conversion rates than social media alone"
- Be concise but substantive — shorter does NOT mean vaguer
- No markdown formatting inside JSON values

TRANSCRIPT:
${transcript}`;

    case 'plus': {
      const insights = getInsightCount(durationSeconds, plan);
      const themes = getThemeCount(durationSeconds);
      return `Provide a detailed structured summary of this YouTube video transcript. Return ONLY valid JSON with this exact structure:

{
  "type": "plus",
  "executiveSummary": "A comprehensive executive summary",
  "themeBreakdown": [
    {"title": "Theme Title", "content": "Detailed explanation of this theme"},
    ...
  ],
  "keyInsights": ["insight 1", "insight 2", ...],
  "estimatedTimeSaved": "X minutes"
}

${lengthGuide}

Rules:
- Executive summary must be detailed and informative (${overviewLen} or longer), mentioning specific topics, arguments, and conclusions
- Break down into ${themes} main themes — each theme's content should be 2-4 sentences with concrete details, examples, or arguments from the video
- Include ${insights} key insights — each must be a specific, actionable piece of knowledge the reader can use
- Every point must contain real substance: specific strategies, numbers, examples, or reasoning from the speaker
- NEVER write vague descriptions like "discusses various strategies" — always say WHAT the strategies are
- Estimate time saved (compare video length vs ~2 min reading time)
- No markdown formatting inside JSON values

TRANSCRIPT:
${transcript}`;
    }

    case 'pro': {
      const insights = getInsightCount(durationSeconds, plan);
      const themes = getThemeCount(durationSeconds);
      return `Provide the most comprehensive structured summary possible of this YouTube video transcript. Return ONLY valid JSON with this exact structure:

{
  "type": "pro",
  "executiveSummary": "A thorough executive summary",
  "topicBreakdown": [
    {"title": "Topic Title", "content": "In-depth analysis of this topic"},
    ...
  ],
  "keyInsights": ["insight 1", "insight 2", ...],
  "actionableTakeaways": ["takeaway 1", "takeaway 2", ...],
  "estimatedTimeSaved": "X minutes",
  "keyQuotes": ["Notable quote or argument 1", ...]
}

${lengthGuide}

Rules:
- Executive summary should be very thorough (${overviewLen} or longer), covering the full arc of the video with specific details
- Break down into ${themes} topics — each topic's content should be 3-6 sentences with in-depth analysis, specific examples, data points, and the speaker's reasoning
- Include ${insights} key insights — each should be a deep, nuanced observation that connects ideas or reveals non-obvious conclusions
- Include 5 actionable takeaways — each must be a concrete step the reader can implement immediately, not generic advice
- Estimate time saved (compare video length vs ~3 min reading time)
- Include 3-5 key quotes or powerful arguments directly from the speaker (paraphrased closely)
- This is the premium tier — the reader should feel they absorbed the full depth of the video without watching it
- NEVER be vague or generic. Every sentence must carry specific, useful information
- No markdown formatting inside JSON values

TRANSCRIPT:
${transcript}`;
    }
  }
}

export function getMultiChunkMergePrompt(
  plan: Plan,
  partialSummaries: string[]
): { system: string; user: string } {
  const schema = getSchemaForPlan(plan);

  return {
    system: SYSTEM_PROMPT,
    user: `You have been given ${partialSummaries.length} partial summaries from different sections of the same video transcript. Merge them into a single cohesive summary. Maintain the same depth and detail level.

Return ONLY valid JSON matching this exact schema:
${schema}

PARTIAL SUMMARIES:
${partialSummaries.map((s, i) => `--- Part ${i + 1} ---\n${s}`).join('\n\n')}`,
  };
}

function getSchemaForPlan(plan: Plan): string {
  switch (plan) {
    case 'basic':
      return `{"type":"basic","overview":"string","keyPoints":["string"]}`;
    case 'plus':
      return `{"type":"plus","executiveSummary":"string","themeBreakdown":[{"title":"string","content":"string"}],"keyInsights":["string"],"estimatedTimeSaved":"string"}`;
    case 'pro':
      return `{"type":"pro","executiveSummary":"string","topicBreakdown":[{"title":"string","content":"string"}],"keyInsights":["string"],"actionableTakeaways":["string"],"estimatedTimeSaved":"string","keyQuotes":["string"]}`;
  }
}
