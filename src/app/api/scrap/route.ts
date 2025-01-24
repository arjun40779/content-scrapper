import { scrapeHtml } from '@/util';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'Please provide a URL to scrape or process.' },
      { status: 400 }
    );
  }

  try {
    const htmlResponse = await axios.get(url);
    const data = scrapeHtml(htmlResponse.data);

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to process the URL.', details: message },
      { status: 500 }
    );
  }
}

