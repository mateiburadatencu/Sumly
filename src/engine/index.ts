import { fetchTranscript, TranscriptError } from './transcript';
import { generateSummary } from './summarizer';
import { getCachedSummary, cacheSummary } from './cache';
import type { Plan, SummaryResult, SummaryData, PlanLimits } from './types';
import { PLAN_LIMITS } from './types';

export { TranscriptError } from './transcript';
export { PLAN_LIMITS } from './types';
export type { Plan, SummaryResult, SummaryData, BasicSummary, PlusSummary, ProSummary, ThemeSection, ProcessingOptions, PlanLimits } from './types';

export interface ProcessVideoOptions {
  videoId: string;
  plan: Plan;
}

/**
 * Core reusable summarization engine.
 * Designed to be called from any context: API routes, cron jobs,
 * Chrome extensions, mobile backends, etc.
 */
export async function processYouTubeVideo(
  options: ProcessVideoOptions
): Promise<SummaryResult> {
  const { videoId, plan } = options;
  const startTime = Date.now();

  const cached = await getCachedSummary(videoId, plan);
  if (cached) {
    return {
      videoId,
      videoTitle: cached.videoTitle,
      plan,
      summary: cached.summary,
      cached: true,
      processingTimeMs: Date.now() - startTime,
    };
  }

  const transcript = await fetchTranscript(videoId);

  const limits = PLAN_LIMITS[plan];
  if (transcript.durationSeconds > limits.maxVideoSeconds) {
    const maxMinutes = Math.floor(limits.maxVideoSeconds / 60);
    const videoMinutes = Math.floor(transcript.durationSeconds / 60);
    throw new VideoLengthError(
      `This video is ${videoMinutes} minutes long. Your ${plan} plan supports videos up to ${maxMinutes} minutes. Please upgrade for longer videos.`
    );
  }

  const videoTitle = await fetchVideoTitle(videoId);
  const summary: SummaryData = await generateSummary(transcript.chunks, plan, transcript.durationSeconds);

  await cacheSummary({
    videoId,
    plan,
    summaryJson: summary,
    transcriptHash: transcript.hash,
    videoTitle,
    videoDurationSeconds: transcript.durationSeconds,
  });

  return {
    videoId,
    videoTitle,
    plan,
    summary,
    cached: false,
    processingTimeMs: Date.now() - startTime,
  };
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    return data.title || 'Untitled Video';
  } catch {
    return 'Untitled Video';
  }
}

export class VideoLengthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoLengthError';
  }
}
