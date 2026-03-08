import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import type { Plan } from '@/engine/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  const url = new URL(request.url);
  const plan = (url.searchParams.get('plan') || 'basic') as Plan;

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('summaries')
    .select('summary_json, video_title, plan, video_id, created_at, video_duration_seconds')
    .eq('video_id', videoId)
    .eq('plan', plan)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
  }

  return NextResponse.json({
    videoId: data.video_id,
    videoTitle: data.video_title || 'Untitled Video',
    plan: data.plan,
    summary: data.summary_json,
    cached: true,
    processingTimeMs: 0,
  });
}
