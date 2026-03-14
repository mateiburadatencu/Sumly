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
    let plan: Plan = 'basic';
    let isTrial = false;
    let trialSummariesUsed = 0;

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const supabase = createSupabaseServiceClient();
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        userId = user.id;
        let { data: profile } = await supabase
          .from('profiles')
          .select('plan, subscription_status, trial_summaries_used')
          .eq('id', user.id)
          .single();

        if (!profile) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
          }, { onConflict: 'id' });
          profile = { plan: 'basic', subscription_status: 'inactive', trial_summaries_used: 0 };
        }

        if (profile.subscription_status === 'active') {
          // Paid subscriber — use their plan
          plan = profile.plan as Plan;
        } else {
          // Free user — check trial eligibility
          trialSummariesUsed = profile.trial_summaries_used ?? 0;
          const TRIAL_LIMIT = 1;

          if (trialSummariesUsed < TRIAL_LIMIT) {
            // Check if this IP has already been used for a trial by a DIFFERENT user
            const { data: existingIp } = await supabase
              .from('trial_ips')
              .select('user_id')
              .eq('ip_address', ip)
              .single();

            const ipUsedByOtherUser = existingIp && existingIp.user_id !== userId;

            if (!ipUsedByOtherUser) {
              plan = 'pro';
              isTrial = true;
            }
          }
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
      const supabase = createSupabaseServiceClient();
      const trackingTasks: Promise<unknown>[] = [
        incrementUsage(userId, ip),
        recordSummaryHistory({ userId, ipAddress: ip, videoId, videoTitle: result.videoTitle, plan }),
      ];

      if (isTrial && userId) {
        const newCount = trialSummariesUsed + 1;
        trackingTasks.push(
          Promise.resolve(supabase.from('profiles')
            .update({ trial_summaries_used: newCount })
            .eq('id', userId)),
          Promise.resolve(supabase.from('trial_ips')
            .upsert({ ip_address: ip, user_id: userId }, { onConflict: 'ip_address', ignoreDuplicates: true })),
        );
      }

      await Promise.all(trackingTasks);
    } catch (trackingError) {
      console.warn('Non-critical: usage/history tracking failed:', trackingError);
    }

    const TRIAL_LIMIT = 1;
    const trialRemaining = isTrial ? TRIAL_LIMIT - (trialSummariesUsed + 1) : null;

    return NextResponse.json({ ...result, trialRemaining });
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
