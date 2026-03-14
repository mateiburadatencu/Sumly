export type Plan = 'basic' | 'plus' | 'pro';

export type VideoCategory =
  | 'mathematics'
  | 'science'
  | 'history'
  | 'literature'
  | 'language'
  | 'tutorial'
  | 'business'
  | 'technology'
  | 'health'
  | 'philosophy'
  | 'general';

export interface BasicSummary {
  type: 'basic';
  videoCategory: VideoCategory;
  overview: string;
  keyPoints: string[];
}

export interface PlusSummary {
  type: 'plus';
  videoCategory: VideoCategory;
  executiveSummary: string;
  themeBreakdown: ThemeSection[];
  keyInsights: string[];
  estimatedTimeSaved: string;
}

export interface ProSummary {
  type: 'pro';
  videoCategory: VideoCategory;
  executiveSummary: string;
  topicBreakdown: ThemeSection[];
  keyInsights: string[];
  actionableTakeaways: string[];
  estimatedTimeSaved: string;
  keyQuotes: string[];
}

export interface ThemeSection {
  title: string;
  content: string;
}

export type SummaryData = BasicSummary | PlusSummary | ProSummary;

export interface SummaryResult {
  videoId: string;
  videoTitle: string;
  plan: Plan;
  summary: SummaryData;
  cached: boolean;
  processingTimeMs: number;
}

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface ProcessingOptions {
  videoId: string;
  plan: Plan;
  userId?: string;
  ipAddress?: string;
}

export interface PlanLimits {
  maxVideoSeconds: number;
  dailyLimit: number;
  monthlyLimit: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  basic: {
    maxVideoSeconds: 15 * 60,
    dailyLimit: 1,
    monthlyLimit: 30,
  },
  plus: {
    maxVideoSeconds: 2 * 60 * 60,
    dailyLimit: 20,
    monthlyLimit: 80,
  },
  pro: {
    maxVideoSeconds: 4 * 60 * 60,
    dailyLimit: 20,
    monthlyLimit: 250,
  },
};
