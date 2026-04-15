import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mapNewsRow } from '@/lib/news';

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

  if (error) throw new Error(error.message);

  const { data } = supabaseAdmin.storage
    .from('site-media')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabaseAdmin
      .from('news')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(mapNewsRow(data));
  } catch (error) {
    console.error('GET /api/news/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();

    const adminPassword = String(formData.get('adminPassword') || '');
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const title = String(formData.get('title') || '');
    const excerpt = String(formData.get('excerpt') || '');
    const content = String(formData.get('content') || '');
    const category = String(formData.get('category') || '');
    const publishDate = String(formData.get('publishDate') || '');
    const imageFile = formData.get('image') as File | null;

    const payload: Record<string, any> = {
      title,
      excerpt,
      content,
      category,
      publish_date: publishDate,
    };

    if (imageFile && imageFile.size > 0) {
      const imageUrl = await uploadFileToSupabase(imageFile, 'news');
      payload.image = imageUrl;

      await supabaseAdmin.from('gallery_images').insert({
        image_url: imageUrl,
        alt_text: title,
        source_type: 'news',
        source_id: id,
        service_id: null,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('news')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json(mapNewsRow(data));
  } catch (error) {
    console.error('PUT /api/news/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const adminPassword = String(body.adminPassword || '');

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabaseAdmin
      .from('gallery_images')
      .delete()
      .eq('source_type', 'news')
      .eq('source_id', id);

    const { error } = await supabaseAdmin
      .from('news')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/news/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}