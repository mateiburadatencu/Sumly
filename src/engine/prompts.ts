import { Plan } from './types';

const SYSTEM_PROMPT = `You are Sumly, an expert knowledge extractor. Your ONLY job is to extract and present the ACTUAL INFORMATION, facts, findings, differences, specs, opinions, and data from the video — written directly, as a knowledgeable expert would write it.

CRITICAL RULES — violating any of these is a failure:

1. NEVER use meta-language. The following phrases are FORBIDDEN:
   "This video explains..." / "This video shows..." / "This video covers..." / "This explains how to..."
   "The speaker discusses..." / "The host talks about..." / "In this video..."
   Start IMMEDIATELY with the actual substance. First sentence = real content.

2. IGNORE filming and production context entirely. If a car is camouflaged, a product is blurred, a face is hidden, or a name is withheld for secrecy — skip it completely. These are filming details, NOT content. Focus 100% on what is actually being revealed, compared, assessed, or taught: the actual differences, features, specs, design changes, performance assessments, opinions, and findings.

3. For review/preview/comparison videos: extract the actual comparisons, differences, improvements, and assessments. What changed vs the previous model? What are the actual dimensions, features, design choices? What is the reviewer's opinion on each aspect? That is the content.

4. Be specific and concrete. Use actual names, numbers, model names, comparisons, and direct assessments. Vague writing is a failure.

5. LANGUAGE RULE: Detect the language of the transcript and write your ENTIRE response in that exact same language.

6. MATH/SCIENCE FORMATTING: When the category is mathematics or science, use LaTeX:
   - Inline math: $x = A^{-1}b$
   - Block equations: $$\\frac{d}{dx}f(x) = \\lim_{h \\to 0} \\frac{f(x+h)-f(x)}{h}$$

Always respond with valid JSON matching the exact schema requested.`;

const CATEGORIES_GUIDANCE: Record<string, string> = {
  mathematics: `This is a MATH video. Focus on: explaining each concept or technique, walking through the logic step by step, stating formulas or rules clearly, and showing how they apply. Takeaways should be steps a student can follow to solve similar problems.`,
  science: `This is a SCIENCE video. Focus on: explaining the underlying principles and mechanisms, defining key terms, explaining cause-and-effect relationships, and connecting the concepts to real-world phenomena.`,
  history: `This is a HISTORY video. Focus on: the chronology of events, key figures and their roles, causes and consequences, historical context, and why these events matter today.`,
  literature: `This is a LITERATURE video. Focus on: themes, symbolism, character motivations, narrative structure, literary devices used, and the deeper meaning the author conveys.`,
  language: `This is a LANGUAGE/GRAMMAR video. Focus on: the rule or concept being taught, clear examples of correct vs. incorrect usage, common mistakes to avoid, and how to apply the rule in practice.`,
  tutorial: `This is a TUTORIAL/HOW-TO video. Focus on: what the viewer will be able to do after watching, a clear step-by-step breakdown of the process, required tools or prerequisites, and important tips or warnings.`,
  business: `This is a BUSINESS video. Focus on: the core strategy or framework being presented, the problem it solves, how to implement it, and what results to expect.`,
  technology: `This is a TECHNOLOGY video. Focus on: what the technology does and why it matters, how it works at a conceptual level, practical use cases, and key things to know when using it.`,
  health: `This is a HEALTH video. Focus on: the health concept or practice being explained, the science or evidence behind it, practical advice, and what to watch out for.`,
  philosophy: `This is a PHILOSOPHY video. Focus on: the core argument or idea, the reasoning behind it, counterarguments, and what this perspective means for how we live or think.`,
  general: `This is a GENERAL video (review, preview, opinion, news, entertainment, or other). Extract the actual findings, comparisons, assessments, differences, and opinions expressed. For reviews/previews: what are the specific things being evaluated, compared, or revealed? What changed vs before? What is the verdict on each aspect? Write it all as direct facts and assessments, not as descriptions of what the video does.`,
};

function detectCategoryInstruction(): string {
  return `Detect the video category from this list: mathematics, science, history, literature, language, tutorial, business, technology, health, philosophy, general. Set it as the "videoCategory" field.`;
}

function getLengthGuidance(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  if (minutes <= 5) return `Short video (~${minutes} min) — be concise but complete.`;
  if (minutes <= 15) return `Medium video (~${minutes} min) — moderate depth.`;
  if (minutes <= 45) return `Long video (~${minutes} min) — thorough explanation.`;
  if (minutes <= 90) return `Very long video (~${minutes} min) — comprehensive, cover all major topics.`;
  return `Extremely long video (~${minutes} min) — extensive, leave nothing important out.`;
}

function getOverviewLength(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  if (minutes <= 5) return '3-4 sentences';
  if (minutes <= 15) return '4-6 sentences';
  if (minutes <= 45) return '6-8 sentences';
  if (minutes <= 90) return '8-11 sentences';
  return '11-14 sentences';
}

function getKeyPointCount(durationSeconds: number, plan: Plan): number {
  const minutes = Math.round(durationSeconds / 60);
  const base = minutes <= 5 ? 4 : minutes <= 15 ? 6 : minutes <= 45 ? 8 : minutes <= 90 ? 10 : 13;
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

function getTopicCount(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  if (minutes <= 5) return '2-3';
  if (minutes <= 15) return '3-5';
  if (minutes <= 45) return '5-7';
  return '6-9';
}

export function getSummaryPrompt(
  plan: Plan,
  transcript: string,
  videoDurationSeconds: number
): { system: string; user: string } {
  const user = buildUserPrompt(plan, transcript, videoDurationSeconds);
  return { system: SYSTEM_PROMPT, user };
}

function buildUserPrompt(plan: Plan, transcript: string, durationSeconds: number): string {
  const lengthGuide = getLengthGuidance(durationSeconds);
  const overviewLen = getOverviewLength(durationSeconds);
  const keyPoints = getKeyPointCount(durationSeconds, plan);
  const categoryInstruction = detectCategoryInstruction();

  // Build category-aware guidance hint (used in the prompt but category is detected by the model)
  const categoryHint = Object.values(CATEGORIES_GUIDANCE).join('\n');

  switch (plan) {
    case 'basic':
      return `Analyze this YouTube video transcript and produce an educational explanation. ${categoryInstruction}

Return ONLY valid JSON with this exact structure:
{
  "type": "basic",
  "videoCategory": "<detected category>",
  "overview": "<explanation of what this video teaches>",
  "keyPoints": ["<concept/fact/step 1>", "<concept/fact/step 2>", ...]
}

${lengthGuide}

CATEGORY GUIDANCE (apply the relevant one based on what you detect):
${categoryHint}

Rules:
- Overview must be ${overviewLen}. FORBIDDEN to start with "This video...", "This explains...", "This covers...". Write the actual content directly as an expert
- Include exactly ${keyPoints} key points — each a direct specific fact, finding, difference, or assessment. Never a meta-description of the video
- Use real names, numbers, model names, comparisons wherever available
- NEVER reference the video, the speaker, or any filming context (camouflage, blurring, etc.)

TRANSCRIPT:
${transcript}`;

    case 'plus': {
      const insights = getInsightCount(durationSeconds, plan);
      const topics = getTopicCount(durationSeconds);
      return `Analyze this YouTube video transcript and produce a detailed educational explanation. ${categoryInstruction}

Return ONLY valid JSON with this exact structure:
{
  "type": "plus",
  "videoCategory": "<detected category>",
  "executiveSummary": "<comprehensive explanation of what this video teaches>",
  "themeBreakdown": [
    {"title": "<concept/section title>", "content": "<explanation of this concept>"},
    ...
  ],
  "keyInsights": ["<insight 1>", ...],
  "estimatedTimeSaved": "<X minutes>"
}

${lengthGuide}

CATEGORY GUIDANCE (apply the relevant one based on what you detect):
${categoryHint}

Rules:
- Executive summary must be ${overviewLen}. Start with the actual substance. FORBIDDEN: "This video...", "This explains...", "The speaker..."
- Break into ${topics} themes/sections with specific, direct content — actual differences, findings, assessments, concepts. 2-4 sentences of real substance each
- Include ${insights} key insights as direct facts and takeaways — never meta-descriptions
- NEVER reference the video, speaker, or filming context
- Estimate time saved vs watching

TRANSCRIPT:
${transcript}`;
    }

    case 'pro': {
      const insights = getInsightCount(durationSeconds, plan);
      const topics = getTopicCount(durationSeconds);
      return `Analyze this YouTube video transcript and produce a comprehensive educational breakdown. ${categoryInstruction}

Return ONLY valid JSON with this exact structure:
{
  "type": "pro",
  "videoCategory": "<detected category>",
  "executiveSummary": "<thorough explanation of everything this video teaches>",
  "topicBreakdown": [
    {"title": "<concept/topic title>", "content": "<in-depth explanation>"},
    ...
  ],
  "keyInsights": ["<insight 1>", ...],
  "actionableTakeaways": ["<step/action 1>", ...],
  "estimatedTimeSaved": "<X minutes>",
  "keyQuotes": ["<important definition, rule, or principle stated>", ...]
}

${lengthGuide}

CATEGORY GUIDANCE (apply the relevant one based on what you detect):
${categoryHint}

Rules:
- Executive summary: ${overviewLen}. FORBIDDEN to begin with "This video...", "This explains...", "The speaker...". Open with the actual substance
- Break into ${topics} topics — each with 3-6 sentences of direct, specific content: actual differences, specs, findings, steps, or assessments. No filler
- ${insights} key insights as direct facts and assessments, not meta-descriptions
- 5 actionable takeaways — concrete and specific. For reviews: what to look for or expect. For tutorials: actual steps. For educational: how to apply it
- Key quotes: 3-5 specific facts, assessments, or rules worth remembering (no filming-context statements)
- NEVER mention the video, the speaker, or any filming/production details

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
    user: `You have ${partialSummaries.length} partial educational explanations from different sections of the same video transcript. Merge them into a single cohesive, complete educational explanation. Keep the same teaching-focused style — explain content directly, never reference "the video" or "the speaker".

Return ONLY valid JSON matching this exact schema:
${schema}

PARTIAL SUMMARIES:
${partialSummaries.map((s, i) => `--- Part ${i + 1} ---\n${s}`).join('\n\n')}`,
  };
}

function getSchemaForPlan(plan: Plan): string {
  switch (plan) {
    case 'basic':
      return `{"type":"basic","videoCategory":"string","overview":"string","keyPoints":["string"]}`;
    case 'plus':
      return `{"type":"plus","videoCategory":"string","executiveSummary":"string","themeBreakdown":[{"title":"string","content":"string"}],"keyInsights":["string"],"estimatedTimeSaved":"string"}`;
    case 'pro':
      return `{"type":"pro","videoCategory":"string","executiveSummary":"string","topicBreakdown":[{"title":"string","content":"string"}],"keyInsights":["string"],"actionableTakeaways":["string"],"estimatedTimeSaved":"string","keyQuotes":["string"]}`;
  }
}
