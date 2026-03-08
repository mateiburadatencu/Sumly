import OpenAI from 'openai';
import { getSummaryPrompt, getMultiChunkMergePrompt } from './prompts';
import type { Plan, SummaryData } from './types';

const MODEL = 'gpt-5-mini';
const TIMEOUT_MS = 120_000;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
  return new OpenAI({ apiKey, timeout: TIMEOUT_MS });
}

export async function generateSummary(
  transcriptChunks: string[],
  plan: Plan,
  videoDurationSeconds: number
): Promise<SummaryData> {
  if (transcriptChunks.length === 1) {
    return summarizeSingleChunk(transcriptChunks[0], plan, videoDurationSeconds);
  }

  return summarizeMultipleChunks(transcriptChunks, plan, videoDurationSeconds);
}

async function summarizeSingleChunk(
  transcript: string,
  plan: Plan,
  videoDurationSeconds: number
): Promise<SummaryData> {
  const { system, user } = getSummaryPrompt(plan, transcript, videoDurationSeconds);
  const raw = await callOpenAI(system, user);
  return parseResponse(raw, plan);
}

async function summarizeMultipleChunks(
  chunks: string[],
  plan: Plan,
  videoDurationSeconds: number
): Promise<SummaryData> {
  const partialResults = await Promise.all(
    chunks.map(async (chunk) => {
      const { system, user } = getSummaryPrompt(plan, chunk, videoDurationSeconds);
      return callOpenAI(system, user);
    })
  );

  const { system, user } = getMultiChunkMergePrompt(plan, partialResults);
  const merged = await callOpenAI(system, user);
  return parseResponse(merged, plan);
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return content;
}

function extractJson(raw: string): string {
  let cleaned = raw.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  const braceStart = cleaned.indexOf('{');
  const braceEnd = cleaned.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    cleaned = cleaned.slice(braceStart, braceEnd + 1);
  }

  return cleaned.trim();
}

function parseResponse(raw: string, plan: Plan): SummaryData {
  try {
    const parsed = JSON.parse(extractJson(raw));
    parsed.type = plan;
    return parsed as SummaryData;
  } catch {
    console.error('Failed to parse AI response. Raw output:', raw.substring(0, 500));
    throw new Error('Failed to parse AI response as JSON');
  }
}
