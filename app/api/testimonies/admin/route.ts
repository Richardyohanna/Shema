import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mapTestimonyRow } from '@/lib/testimonies';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('testimonies')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('GET /api/testimonies/admin failed', {
        operation: 'select testimonies ordered by display_order',
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      const tableMissing = error.code === 'PGRST205' || error.code === '42P01';
      return NextResponse.json(
        {
          error: tableMissing
            ? 'The testimony database table is missing. Run supabase/testimonies.sql in the Supabase SQL Editor.'
            : 'Unable to load testimonies. Check the server logs for the Supabase error code.',
        },
        { status: tableMissing ? 503 : 500 }
      );
    }

    return NextResponse.json((data || []).map(mapTestimonyRow).filter(Boolean));
  } catch (error) {
    console.error('GET /api/testimonies/admin error:', error);
    return NextResponse.json(
      { error: 'Unable to load testimonies.' },
      { status: 500 }
    );
  }
}
