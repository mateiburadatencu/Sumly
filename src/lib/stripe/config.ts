import type { Plan } from '@/engine/types';

export interface PlanConfig {
  name: string;
  plan: Plan;
  priceMonthly: string;
  priceAnnual: string;
  priceMonthlyId: string;
  priceAnnualId: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    name: 'Basic',
    plan: 'basic',
    priceMonthly: 'Free',
    priceAnnual: 'Free',
    priceMonthlyId: '',
    priceAnnualId: '',
    features: [
      '1 summary per day',
      'Videos up to 15 minutes',
      'Basic summary format',
      'PDF export (with watermark)',
    ],
  },
  {
    name: 'Plus',
    plan: 'plus',
    priceMonthly: '€4.99',
    priceAnnual: '€49',
    priceMonthlyId: process.env.STRIPE_PRICE_PLUS_MONTHLY || '',
    priceAnnualId: process.env.STRIPE_PRICE_PLUS_ANNUAL || '',
    highlighted: true,
    features: [
      '80 summaries per month',
      'Videos up to 2 hours',
      'Detailed structured summary',
      'PDF export (no watermark)',
      'Faster processing',
      'Study Mode Lite (coming soon)',
    ],
  },
  {
    name: 'Pro',
    plan: 'pro',
    priceMonthly: '€9.99',
    priceAnnual: '€99',
    priceMonthlyId: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    priceAnnualId: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
    features: [
      '250 summaries per month',
      'Videos up to 4 hours',
      'Full detailed summary',
      'PDF export (no watermark)',
      'Highest priority processing',
      'Advanced study features (coming soon)',
    ],
  },
];

export function getPlanFromPriceId(priceId: string): Plan {
  const plusMonthly = process.env.STRIPE_PRICE_PLUS_MONTHLY;
  const plusAnnual = process.env.STRIPE_PRICE_PLUS_ANNUAL;
  const proMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const proAnnual = process.env.STRIPE_PRICE_PRO_ANNUAL;

  if (priceId === plusMonthly || priceId === plusAnnual) return 'plus';
  if (priceId === proMonthly || priceId === proAnnual) return 'pro';
  return 'basic';
}
