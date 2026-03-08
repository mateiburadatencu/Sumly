import { NextRequest, NextResponse } from 'next/server';
import { generateSummaryPdf } from '@/lib/utils/pdf';
import type { SummaryData } from '@/engine/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoTitle, summary, plan } = body as {
      videoTitle: string;
      summary: SummaryData;
      plan: string;
    };

    if (!videoTitle || !summary || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const addWatermark = plan === 'basic';
    const pdfBuffer = await generateSummaryPdf({
      videoTitle,
      summary,
      plan,
      addWatermark,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sumly-${encodeURIComponent(videoTitle.slice(0, 50))}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF.' },
      { status: 500 }
    );
  }
}
