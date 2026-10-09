import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const VIDEO_LIMIT = 500 * 1024 * 1024;
const IMAGE_LIMIT = 12 * 1024 * 1024;
const imageTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const videoTypes: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
};

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
    }
    const details = body as Record<string, unknown>;
    const fileName = details.fileName;
    const fileType = details.fileType;
    const fileSize = Number(details.fileSize);
    const kind = details.kind;

    if (
      typeof fileName !== 'string' ||
      typeof fileType !== 'string' ||
      !Number.isFinite(fileSize) ||
      (kind !== 'video' && kind !== 'thumbnail' && kind !== 'image' && kind !== 'event-cover')
    ) {
      return NextResponse.json({ error: 'Choose a valid video or thumbnail file.' }, { status: 400 });
    }

    const allowedTypes = kind === 'video' ? videoTypes : imageTypes;
    const extension = allowedTypes[fileType];
    const limit = kind === 'video' ? VIDEO_LIMIT : IMAGE_LIMIT;
    if (!extension) {
      return NextResponse.json(
        { error: kind === 'video' ? 'Use an MP4, MOV, WebM, or Ogg video.' : 'Use a JPEG, PNG, or WebP image.' },
        { status: 400 }
      );
    }
    if (fileSize <= 0 || fileSize > limit) {
      return NextResponse.json(
        { error: `File must be between 1 byte and ${kind === 'video' ? '500 MB' : '12 MB'}.` },
        { status: 400 }
      );
    }

    const folder = kind === 'video'
      ? 'testimonies/videos'
      : kind === 'event-cover'
        ? 'events/covers'
        : kind === 'image'
          ? 'testimonies/images'
          : 'testimonies/thumbnails';
    const filePath = `${folder}/${crypto.randomUUID()}.${extension}`;
    const { data: signedUpload, error: uploadError } = await supabaseAdmin.storage
      .from('site-media')
      .createSignedUploadUrl(filePath, { upsert: false });

    if (uploadError || !signedUpload) {
      console.error('POST /api/testimonies/upload failed to create signed upload', {
        operation: 'createSignedUploadUrl',
        bucket: 'site-media',
        code: uploadError?.statusCode || null,
        message: uploadError?.message || 'No signed upload data returned.',
      });
      return NextResponse.json(
        {
          error: uploadError?.message
            ? `Could not prepare the upload: ${uploadError.message}`
            : 'Could not prepare the upload. Check server logs for the Storage error.',
        },
        { status: String(uploadError?.statusCode) === '404' ? 404 : 502 }
      );
    }

    const { data } = supabaseAdmin.storage.from('site-media').getPublicUrl(filePath);
    return NextResponse.json({
      url: data.publicUrl,
      path: signedUpload.path,
      token: signedUpload.token,
      fileName,
      size: fileSize,
      contentType: fileType,
    });
  } catch (error) {
    console.error('POST /api/testimonies/upload error:', error);
    return NextResponse.json({ error: 'Unable to upload media.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const paths = body && typeof body === 'object' && Array.isArray((body as Record<string, unknown>).paths)
      ? (body as { paths: unknown[] }).paths
      : [];
    const validPaths = [...new Set(paths.filter((path): path is string =>
      typeof path === 'string' &&
      (path.startsWith('testimonies/videos/') ||
        path.startsWith('testimonies/thumbnails/') ||
        path.startsWith('testimonies/images/') ||
        path.startsWith('events/covers/')) &&
      !path.split('/').some((part) => part === '..')
    ))];

    if (!validPaths.length) {
      return NextResponse.json({ error: 'No valid testimony media paths were provided.' }, { status: 400 });
    }

    const unreferenced: string[] = [];
    for (const path of validPaths) {
      const { data: publicUrl } = supabaseAdmin.storage.from('site-media').getPublicUrl(path);
      const [videoRefs, thumbnailRefs, imageRefs, coverRefs] = await Promise.all([
        supabaseAdmin.from('testimonies').select('id').eq('video_url', publicUrl.publicUrl).limit(1),
        supabaseAdmin.from('testimonies').select('id').eq('thumbnail_url', publicUrl.publicUrl).limit(1),
        supabaseAdmin.from('testimonies').select('id').eq('image_url', publicUrl.publicUrl).limit(1),
        supabaseAdmin.from('events').select('id').eq('cover_image_url', publicUrl.publicUrl).limit(1),
      ]);
      if (videoRefs.error || thumbnailRefs.error || imageRefs.error || coverRefs.error) {
        const error = videoRefs.error || thumbnailRefs.error || imageRefs.error || coverRefs.error;
        const schemaMissing = [videoRefs.error?.code, thumbnailRefs.error?.code, imageRefs.error?.code, coverRefs.error?.code]
          .some((code) => code === 'PGRST205' || code === '42P01');
        if (schemaMissing) {
          unreferenced.push(path);
          continue;
        }
        console.error('DELETE /api/testimonies/upload reference check failed', {
          operation: 'check media references',
          code: error?.code,
          message: error?.message,
        });
        return NextResponse.json(
          { error: 'Could not verify whether uploaded media is in use; no files were removed.' },
          { status: 500 }
        );
      }
      if (!videoRefs.data?.length && !thumbnailRefs.data?.length &&
          !imageRefs.data?.length && !coverRefs.data?.length) unreferenced.push(path);
    }

    if (unreferenced.length) {
      const { error } = await supabaseAdmin.storage.from('site-media').remove(unreferenced);
      if (error) {
        console.error('DELETE /api/testimonies/upload storage removal failed', {
          operation: 'remove unreferenced testimony media',
          code: error.statusCode,
          message: error.message,
        });
        return NextResponse.json({ error: `The testimony was not saved and temporary media cleanup failed: ${error.message}` }, { status: 502 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/testimonies/upload error:', error);
    return NextResponse.json({ error: 'Unable to clean up unused testimony media.' }, { status: 500 });
  }
}
