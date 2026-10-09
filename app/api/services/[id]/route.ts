import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mapServiceRow, mapBeneficiaryRow } from '@/lib/services';
import { getServiceById } from '@/lib/services-data';
import { mapTestimonyRow } from '@/lib/testimonies';
import { mapEventRow } from '@/lib/events';
import { getServiceFromDatabase } from '@/lib/services-store';
import { revalidateServiceContent } from '@/lib/revalidate-content';

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
    const service = await getServiceFromDatabase(id);
    const staticService = getServiceById(id);
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    let beneficiaries: Record<string, unknown>[] = [];
    const [{ data: beneficiaryRows, error: beneficiaryError }, { data: legacyGalleryRows, error: galleryError }] = await Promise.all([
      supabaseAdmin.from('service_beneficiaries').select('*').eq('service_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('gallery_images').select('*').eq('service_id', id).order('created_at', { ascending: false }),
    ]);
    if (beneficiaryError) console.warn('Legacy service beneficiary fallback query failed.', { code: beneficiaryError.code, message: beneficiaryError.message });
    if (galleryError) console.warn('Legacy service gallery fallback query failed.', { code: galleryError.code, message: galleryError.message });
    beneficiaries = (beneficiaryRows ?? []) as Record<string, unknown>[];

    const [{ data: testimonyRows, error: testimonyError }, { data: eventRows, error: eventError }] = await Promise.all([
      supabaseAdmin.from('testimonies').select('*').eq('service_id', id).eq('published', true).order('display_order', { ascending: true }),
      supabaseAdmin.from('events').select('*').eq('service_id', id).eq('published', true).order('date', { ascending: false }),
    ]);
    if (testimonyError) console.error('GET /api/services/[id] testimony query failed', { code: testimonyError.code, message: testimonyError.message });
    if (eventError) console.error('GET /api/services/[id] event query failed', { code: eventError.code, message: eventError.message });

    const staticStories = staticService?.beneficiaryStories.map((story) => ({
      id: story.id,
      serviceId: staticService.id,
      slug: story.id,
      name: story.name,
      story: story.story,
      fullStory: story.fullStory,
      image: story.image,
      createdAt: '',
    })) ?? [];

    return NextResponse.json({
      ...service,
      beneficiaryStories: beneficiaries.length
        ? beneficiaries.map(mapBeneficiaryRow)
        : staticStories,
      gallery: service.gallery.length
        ? service.gallery
        : (legacyGalleryRows ?? []).map((item) => String(item.image_url || '')).filter(Boolean).length
          ? (legacyGalleryRows ?? []).map((item) => String(item.image_url || '')).filter(Boolean)
          : staticService?.gallery ?? [],
      testimonies: (testimonyRows ?? []).map(mapTestimonyRow).filter(Boolean),
      events: (eventRows ?? []).map(mapEventRow),
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

    let impact: unknown;
    try {
      impact = JSON.parse(impactRaw);
    } catch {
      return NextResponse.json({ error: 'Impact must be valid JSON.' }, { status: 400 });
    }
    if (!impact || typeof impact !== 'object' || Array.isArray(impact)) {
      return NextResponse.json({ error: 'Impact must be a JSON object.' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      title,
      short_description: shortDescription,
      description,
      impact,
      updated_at: new Date().toISOString(),
    };

    const galleryField = formData.get('gallery');
    if (typeof galleryField === 'string') {
      try {
        const gallery: unknown = JSON.parse(galleryField);
        if (!Array.isArray(gallery) || !gallery.every((item) => typeof item === 'string')) {
          return NextResponse.json({ error: 'Gallery must be a JSON array of URLs.' }, { status: 400 });
        }
        payload.gallery = gallery;
      } catch {
        return NextResponse.json({ error: 'Gallery must be valid JSON.' }, { status: 400 });
      }
    }
    const publishedField = formData.get('published');
    if (publishedField === 'true' || publishedField === 'false') {
      payload.published = publishedField === 'true';
    }

    if (imageFile && imageFile.size > 0) {
      const imageUrl = await uploadFileToSupabase(imageFile, 'services');
      payload.image_url = imageUrl;
      const existingGallery = Array.isArray(existing.gallery)
        ? existing.gallery.filter((url: unknown): url is string => typeof url === 'string')
        : [];
      if (!('gallery' in payload)) payload.gallery = [imageUrl, ...existingGallery];
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

    revalidateServiceContent(id);
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

    const { error: galleryDeleteError } = await supabaseAdmin
      .from('gallery_images')
      .delete()
      .eq('service_id', id);
    if (galleryDeleteError && galleryDeleteError.code !== '42P01' && galleryDeleteError.code !== 'PGRST205') {
      console.error('DELETE /api/services/[id] gallery cleanup failed', {
        operation: 'delete legacy service gallery rows',
        code: galleryDeleteError.code,
        message: galleryDeleteError.message,
      });
      return NextResponse.json({ error: 'Unable to delete service gallery records.' }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateServiceContent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/services/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}