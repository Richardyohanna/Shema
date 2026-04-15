import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mapServiceRow } from '@/lib/services';

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

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data || []).map(mapServiceRow));
  } catch (error) {
    console.error('GET /api/services error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const adminPassword = String(formData.get('adminPassword') || '');
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slug = String(formData.get('slug') || '');
    const title = String(formData.get('title') || '');
    const shortDescription = String(formData.get('shortDescription') || '');
    const description = String(formData.get('description') || '');
    const impactRaw = String(formData.get('impact') || '{}');
    const imageFile = formData.get('image') as File | null;

    if (!slug || !title || !shortDescription || !description || !imageFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const imageUrl = await uploadFileToSupabase(imageFile, 'services');
    const impact = JSON.parse(impactRaw);

    const { data, error } = await supabaseAdmin
      .from('services')
      .insert({
        slug,
        title,
        short_description: shortDescription,
        description,
        image: imageUrl,
        impact,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from('gallery_images').insert({
      image_url: imageUrl,
      alt_text: title,
      source_type: 'service',
      source_id: data.id,
      service_id: data.id,
    });

    return NextResponse.json(mapServiceRow(data), { status: 201 });
  } catch (error) {
    console.error('POST /api/services error:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}