import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { PLAN_LIMITS, type Plan } from '@/engine/types';

interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  currentDaily: number;
  currentMonthly: number;
}

export async function checkUsage(
  userId: string | null,
  ipAddress: string,
  plan: Plan
): Promise<UsageCheckResult> {
  const supabase = createSupabaseServiceClient();
  const limits = PLAN_LIMITS[plan];
  const today = new Date().toISOString().split('T')[0];

  const lookupField = userId ? 'user_id' : 'ip_address';
  const lookupValue = userId || ipAddress;

  const { data: usage } = await supabase
    .from('user_usage')
    .select('*')
    .eq(lookupField, lookupValue)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({
      user_id: userId || null,
      ip_address: userId ? null : ipAddress,
      plan,
      daily_count: 0,
      monthly_count: 0,
      daily_reset_date: today,
      monthly_reset_date: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
    });
    return { allowed: true, currentDaily: 0, currentMonthly: 0 };
  }

  let dailyCount = usage.daily_count;
  let monthlyCount = usage.monthly_count;

  if (usage.daily_reset_date < today) {
    dailyCount = 0;
    await supabase
      .from('user_usage')
      .update({ daily_count: 0, daily_reset_date: today })
      .eq(lookupField, lookupValue);
  }

  if (usage.monthly_reset_date <= today) {
    monthlyCount = 0;
    const nextReset = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];
    await supabase
      .from('user_usage')
      .update({ monthly_count: 0, monthly_reset_date: nextReset })
      .eq(lookupField, lookupValue);
  }

  if (dailyCount >= limits.dailyLimit) {
    return {
      allowed: false,
      reason:
        plan === 'basic'
          ? 'You have reached your daily free summary. Sign up for Plus to get 80 summaries per month.'
          : `You have reached your daily limit of ${limits.dailyLimit} summaries. Try again tomorrow.`,
      currentDaily: dailyCount,
      currentMonthly: monthlyCount,
    };
  }

  if (monthlyCount >= limits.monthlyLimit) {
    return {
      allowed: false,
      reason: `You have reached your monthly limit of ${limits.monthlyLimit} summaries. Upgrade your plan for more.`,
      currentDaily: dailyCount,
      currentMonthly: monthlyCount,
    };
  }

  return { allowed: true, currentDaily: dailyCount, currentMonthly: monthlyCount };
}

export async function incrementUsage(
  userId: string | null,
  ipAddress: string
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const lookupField = userId ? 'user_id' : 'ip_address';
  const lookupValue = userId || ipAddress;

  const { data: usage } = await supabase
    .from('user_usage')
    .select('daily_count, monthly_count')
    .eq(lookupField, lookupValue)
    .single();

  if (usage) {
    await supabase
      .from('user_usage')
      .update({
        daily_count: usage.daily_count + 1,
        monthly_count: usage.monthly_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq(lookupField, lookupValue);
  }
}

export async function recordSummaryHistory(params: {
  userId: string | null;
  ipAddress: string;
  videoId: string;
  videoTitle: string;
  plan: Plan;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from('summary_history').insert({
    user_id: params.userId || null,
    ip_address: params.userId ? null : params.ipAddress,
    video_id: params.videoId,
    video_title: params.videoTitle,
    plan: params.plan,
  });

  if (error) {
    console.error('recordSummaryHistory failed:', error.message, error.details);
    throw new Error(`History insert failed: ${error.message}`);
  }
}
