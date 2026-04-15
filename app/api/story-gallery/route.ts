import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      (data || []).map((item) => ({
        id: item.id,
        src: item.image_url,
        alt: item.alt_text || 'SHEMA gallery image',
        sourceType: item.source_type,
        sourceId: item.source_id,
      }))
    );
  } catch (error) {
    console.error('GET /api/story-gallery error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}