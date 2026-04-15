import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mapServiceRow, mapBeneficiaryRow } from '@/lib/services';

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

    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('slug', id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const { data: beneficiaries } = await supabaseAdmin
      .from('service_beneficiaries')
      .select('*')
      .eq('service_id', service.id)
      .order('created_at', { ascending: false });

    const { data: gallery } = await supabaseAdmin
      .from('gallery_images')
      .select('*')
      .eq('service_id', service.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      ...mapServiceRow(service),
      beneficiaryStories: (beneficiaries || []).map(mapBeneficiaryRow),
      gallery: (gallery || []).map((item) => item.image_url),
    });
  } catch (error) {
    console.error('GET /api/services/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
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
    const shortDescription = String(formData.get('shortDescription') || '');
    const description = String(formData.get('description') || '');
    const impactRaw = String(formData.get('impact') || '{}');
    const imageFile = formData.get('image') as File | null;

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const payload: Record<string, any> = {
      title,
      short_description: shortDescription,
      description,
      impact: JSON.parse(impactRaw),
    };

    if (imageFile && imageFile.size > 0) {
      const imageUrl = await uploadFileToSupabase(imageFile, 'services');
      payload.image = imageUrl;

      await supabaseAdmin.from('gallery_images').insert({
        image_url: imageUrl,
        alt_text: title || existing.title,
        source_type: 'service',
        source_id: existing.id,
        service_id: existing.id,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('services')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json(mapServiceRow(data));
  } catch (error) {
    console.error('PUT /api/services/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
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
      .eq('service_id', id);

    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/services/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}