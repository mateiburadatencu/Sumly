import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createSupabaseServiceClient();
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { plan, billing } = await request.json();
    if (!plan || !billing) {
      return NextResponse.json({ error: 'Plan and billing required' }, { status: 400 });
    }

    const PRICE_MAP: Record<string, Record<string, string | undefined>> = {
      plus: {
        monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY,
        annual: process.env.STRIPE_PRICE_PLUS_ANNUAL,
      },
      pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
        annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
      },
    };

    const priceId = PRICE_MAP[plan]?.[billing];
    if (!priceId || priceId.startsWith('price_') && priceId.length < 20) {
      console.error('Invalid or missing Stripe price ID for', plan, billing, ':', priceId);
      return NextResponse.json({ error: 'This plan is not yet available. Please contact support.' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
