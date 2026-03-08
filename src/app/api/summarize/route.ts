import { NextRequest, NextResponse } from 'next/server';
import { processYouTubeVideo, TranscriptError, VideoLengthError } from '@/engine';
import type { Plan } from '@/engine/types';
import { extractVideoId } from '@/lib/utils/youtube';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { checkUsage, incrementUsage, recordSummaryHistory } from '@/lib/utils/usage';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const { allowed, retryAfterMs } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid YouTube URL.' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Please provide a valid link.' },
        { status: 400 }
      );
    }

    let userId: string | null = null;
    // TODO: Revert to 'basic' before production launch
    let plan: Plan = 'pro';

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const supabase = createSupabaseServiceClient();
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, subscription_status')
          .eq('id', user.id)
          .single();

        if (!profile) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
          }, { onConflict: 'id' });
        } else if (profile.subscription_status === 'active') {
          plan = profile.plan as Plan;
        }
      }
    }

    // TODO: Re-enable usage limits before production launch
    // const usageCheck = await checkUsage(userId, ip, plan);
    // if (!usageCheck.allowed) {
    //   return NextResponse.json(
    //     { error: usageCheck.reason },
    //     { status: 403 }
    //   );
    // }

    const result = await processYouTubeVideo({ videoId, plan });

    try {
      await Promise.all([
        incrementUsage(userId, ip),
        recordSummaryHistory({
          userId,
          ipAddress: ip,
          videoId,
          videoTitle: result.videoTitle,
          plan,
        }),
      ]);
    } catch (trackingError) {
      console.warn('Non-critical: usage/history tracking failed:', trackingError);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TranscriptError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof VideoLengthError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error('Summarize error:', message, error);
    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}
