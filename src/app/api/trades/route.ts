import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-server';

export async function POST(req: Request) {
  const did = await requireAuth(req);
  if (!did) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { wallet_address, type, token_address, amount_sol, amount_token } = body;

    if (!wallet_address || !type || !token_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('trades')
      .insert([
        {
          wallet_address,
          type,
          token_address,
          amount_sol,
          amount_token,
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, trade: data[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet_address = searchParams.get('wallet_address');

  if (!wallet_address) {
    return NextResponse.json({ error: 'Missing wallet_address' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('wallet_address', wallet_address)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ trades: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
