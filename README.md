# Sumly

AI-powered YouTube video summarizer. Paste any YouTube link and get a structured summary in seconds.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database & Auth**: Supabase
- **Payments**: Stripe (subscriptions + webhooks)
- **AI**: OpenAI GPT-4.1-mini
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- Stripe account
- OpenAI API key

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd sumly
npm install
```

### 2. Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_PRICE_PLUS_MONTHLY` | Stripe Price ID for Plus monthly |
| `STRIPE_PRICE_PLUS_ANNUAL` | Stripe Price ID for Plus annual |
| `STRIPE_PRICE_PRO_MONTHLY` | Stripe Price ID for Pro monthly |
| `STRIPE_PRICE_PRO_ANNUAL` | Stripe Price ID for Pro annual |
| `NEXT_PUBLIC_APP_URL` | Your app URL (http://localhost:3000 for dev) |

### 3. Supabase Setup

1. Create a new Supabase project
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Enable **Email/Password** auth in Authentication > Providers
4. (Optional) Enable **Google** OAuth in Authentication > Providers

### 4. Stripe Setup

1. Create products in the Stripe dashboard:

| Product | Price | Price ID env var |
|---------|-------|------------------|
| Sumly Plus Monthly | €4.99/month | `STRIPE_PRICE_PLUS_MONTHLY` |
| Sumly Plus Annual | €49/year | `STRIPE_PRICE_PLUS_ANNUAL` |
| Sumly Pro Monthly | €9.99/month | `STRIPE_PRICE_PRO_MONTHLY` |
| Sumly Pro Annual | €99/year | `STRIPE_PRICE_PRO_ANNUAL` |

2. Set up a webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

3. For local development, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── summarize/    # Main summarization endpoint
│   │   ├── export-pdf/   # PDF export endpoint
│   │   ├── webhooks/     # Stripe webhooks
│   │   ├── create-checkout/
│   │   └── create-portal/
│   ├── auth/             # Login & signup pages
│   ├── dashboard/        # User dashboard
│   └── pricing/          # Pricing page
├── components/           # React UI components
├── engine/               # Core summarization engine (reusable)
│   ├── index.ts          # Main entry: processYouTubeVideo()
│   ├── transcript.ts     # Transcript fetching & processing
│   ├── summarizer.ts     # OpenAI summarization
│   ├── prompts.ts        # AI prompt templates per plan
│   ├── cache.ts          # Supabase caching layer
│   └── types.ts          # TypeScript types & plan limits
├── lib/                  # Shared utilities
│   ├── supabase/         # Supabase client/server helpers
│   ├── stripe/           # Stripe client & config
│   ├── openai/           # OpenAI client
│   └── utils/            # YouTube parser, rate-limit, usage, PDF
└── middleware.ts          # Auth session middleware
```

## Core Engine

The summarization engine (`src/engine/`) is designed to be fully decoupled from the UI. It can be imported and used from:

- API routes (current)
- Cron jobs
- Chrome extension backend
- Mobile app backend
- Student AI platform

```typescript
import { processYouTubeVideo } from '@/engine';

const result = await processYouTubeVideo({
  videoId: 'dQw4w9WgXcQ',
  plan: 'plus',
});
```

## Plans

| | Basic | Plus | Pro |
|--|-------|------|-----|
| Price | Free | €4.99/mo | €9.99/mo |
| Summaries | 1/day | 80/mo | 250/mo |
| Max video | 15 min | 2 hours | 4 hours |
| Detail level | Basic | Detailed | Full |
| PDF watermark | Yes | No | No |

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

The `maxDuration` on the summarize route is set to 120s for Vercel Pro plans. Adjust if needed.

## License

Private — All rights reserved.
