import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai/client';
import type { SummaryData, VideoCategory } from '@/engine/types';
import { generateCheatSheetPdf } from '@/lib/utils/pdf';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export const maxDuration = 120;

export interface FormulaEntry {
  name: string;
  formula: string;
  whenToUse: string;
}

export interface EssaySection {
  heading: string;
  paragraphs: string[];
}

export interface CheatSheetData {
  subject: string;
  category: VideoCategory;
  essay: EssaySection[];
  formulas: FormulaEntry[];
  importantFacts: string[];
  additionalKnowledge: { concept: string; explanation: string }[];
  dictionary: { term: string; definition: string }[];
  studyTips: string[];
}

function buildSummaryText(summary: SummaryData): string {
  if (summary.type === 'basic') {
    return `Overview: ${summary.overview}\nKey Points:\n${summary.keyPoints.map(p => `- ${p}`).join('\n')}`;
  }
  if (summary.type === 'plus') {
    return `Executive Summary: ${summary.executiveSummary}\nThemes:\n${summary.themeBreakdown.map(t => `- ${t.title}: ${t.content}`).join('\n')}\nKey Insights:\n${summary.keyInsights.map(i => `- ${i}`).join('\n')}`;
  }
  return `Executive Summary: ${summary.executiveSummary}\nTopics:\n${summary.topicBreakdown.map(t => `- ${t.title}: ${t.content}`).join('\n')}\nKey Insights:\n${summary.keyInsights.map(i => `- ${i}`).join('\n')}\nTakeaways:\n${summary.actionableTakeaways.map(t => `- ${t}`).join('\n')}`;
}

export async function POST(req: NextRequest) {
  try {
    // Verify the user is on Plus or Pro
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const supabase = createSupabaseServiceClient();
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, subscription_status')
      .eq('id', user.id)
      .single();
    const plan = profile?.subscription_status === 'active' ? profile.plan : 'basic';
    if (plan !== 'plus' && plan !== 'pro') {
      return NextResponse.json({ error: 'Cheat sheets require a Plus or Pro plan' }, { status: 403 });
    }

    const { videoTitle, summary, category } = await req.json() as {
      videoTitle: string;
      summary: SummaryData;
      category: VideoCategory;
    };

    const summaryText = buildSummaryText(summary);
    const needsFormulas = category === 'mathematics' || category === 'science';

    const prompt = `You are a university-level educator writing a complete, in-depth cheat sheet for a student studying: ${category}.

The student watched a YouTube video titled: "${videoTitle}"

Video content:
${summaryText}

Your task is to generate a COMPREHENSIVE, DETAILED cheat sheet in JSON. Be thorough — this should feel like a real study document a professor would hand out.

RULES:
- Write in the SAME LANGUAGE as the video content above.
- The essay must be a COMPLETE, FLOWING educational text covering the subject fully — both what the video covered AND what it didn't. This is the most important section. Each section should have 2-4 rich paragraphs that really teach the topic.
- The dictionary must include EVERY term a student might not know — technical vocabulary, jargon, names, concepts. Be exhaustive (15-25 entries minimum).
${needsFormulas ? '- Since this is math/science: include all relevant formulas with clear notation. Use plain text notation (no LaTeX markup).' : '- formulas must be an empty array [].'}

Return ONLY valid JSON with this exact structure:
{
  "subject": "Specific subject name (e.g. Quadratic Equations, The French Revolution)",
  "essay": [
    {
      "heading": "Section heading",
      "paragraphs": [
        "First full paragraph...",
        "Second full paragraph...",
        "Third full paragraph..."
      ]
    }
  ],
  "formulas": [
    { "name": "Formula name", "formula": "The formula", "whenToUse": "When and why to use it" }
  ],
  "importantFacts": [
    "Complete, informative fact with context — not just a short phrase"
  ],
  "additionalKnowledge": [
    { "concept": "Topic the video didn't cover", "explanation": "Detailed explanation of why this matters and what to know" }
  ],
  "dictionary": [
    { "term": "Term", "definition": "Full, clear definition a student can understand" }
  ],
  "studyTips": ["Specific, actionable study tip"]
}

Aim for:
- 4-7 essay sections, each with 2-4 paragraphs (each paragraph at least 3-5 sentences)
- ${needsFormulas ? '5-10 formulas' : '0 formulas'}
- 8-12 importantFacts (each a full sentence with context)
- 5-8 additionalKnowledge items with detailed explanations
- 15-25 dictionary entries covering all key vocabulary
- 4-6 studyTips`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 10000,
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const braceStart = raw.indexOf('{');
    const braceEnd = raw.lastIndexOf('}');
    if (braceStart === -1 || braceEnd === -1) {
      throw new Error('Failed to parse cheat sheet response');
    }

    const data: CheatSheetData = JSON.parse(raw.slice(braceStart, braceEnd + 1));
    data.category = category;

    const pdfBuffer = await generateCheatSheetPdf({ videoTitle, data });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cheatsheet-${videoTitle.slice(0, 40).replace(/[^a-z0-9]/gi, '-')}.pdf"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Cheat sheet generation failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
