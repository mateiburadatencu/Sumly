import { createClient } from '@supabase/supabase-js';
import type { Plan, SummaryData } from './types';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

export async function getCachedSummary(
  videoId: string,
  plan: Plan
): Promise<{ summary: SummaryData; videoTitle: string } | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('summaries')
    .select('summary_json, video_title')
    .eq('video_id', videoId)
    .eq('plan', plan)
    .single();

  if (error || !data) return null;

  return {
    summary: data.summary_json as SummaryData,
    videoTitle: data.video_title || '',
  };
}

export async function cacheSummary(params: {
  videoId: string;
  plan: Plan;
  summaryJson: SummaryData;
  transcriptHash: string;
  videoTitle: string;
  videoDurationSeconds: number;
}): Promise<void> {
  const supabase = getServiceClient();

  await supabase.from('summaries').upsert(
    {
      video_id: params.videoId,
      plan: params.plan,
      summary_json: params.summaryJson,
      transcript_hash: params.transcriptHash,
      video_title: params.videoTitle,
      video_duration_seconds: params.videoDurationSeconds,
    },
    { onConflict: 'video_id,plan' }
  );
}
