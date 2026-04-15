import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mapNewsRow } from '@/lib/news';

async function uploadFileToSupabase(file: File, folder: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from('site-media')
    .upload(filePath, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseAdmin.storage
    .from('site-media')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('news')
      .select('*')
      .order('publish_date', { ascending: false });

    if (error) {
      console.error('GET news error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data || []).map(mapNewsRow));
  } catch (error) {
    console.error('GET /api/news error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const adminPassword = String(formData.get('adminPassword') || '');
    const title = String(formData.get('title') || '');
    const excerpt = String(formData.get('excerpt') || '');
    const content = String(formData.get('content') || '');
    const category = String(formData.get('category') || '');
    const publishDate = String(formData.get('publishDate') || '');
    const imageFile = formData.get('image') as File | null;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!title || !excerpt || !content || !category || !publishDate || !imageFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const imageUrl = await uploadFileToSupabase(imageFile, 'news');

    const { data, error } = await supabaseAdmin
      .from('news')
      .insert({
        title,
        excerpt,
        content,
        category,
        publish_date: publishDate,
        image: imageUrl,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('News insert error:', error);
      return NextResponse.json(
        { error: error?.message || 'Failed to create news' },
        { status: 500 }
      );
    }

    const { error: galleryError } = await supabaseAdmin
      .from('gallery_images')
      .insert({
        image_url: imageUrl,
        alt_text: title,
        source_type: 'news',
        source_id: String(data.id),
        service_id: null,
      });

    if (galleryError) {
      console.error('Gallery insert error:', galleryError);
      return NextResponse.json(
        { error: `News saved, but gallery insert failed: ${galleryError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(mapNewsRow(data), { status: 201 });
  } catch (error) {
    console.error('POST /api/news error:', error);
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 });
  }
}