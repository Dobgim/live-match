import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'fixtures'; // fixtures | live
  const secret = searchParams.get('secret') ?? req.headers.get('x-cron-secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const edgeFunctionName = type === 'live' ? 'live-poll' : 'sync-fixtures';
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${edgeFunctionName}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      return NextResponse.json({ error: `Edge Function failed: ${errorMsg}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, response: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
