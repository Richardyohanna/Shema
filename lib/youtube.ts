const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function validVideoId(value: string | null | undefined): string | null {
  return value && VIDEO_ID_PATTERN.test(value) ? value : null;
}

export function getYouTubeId(input: string): string | null {
  const value = input.trim();
  const bareId = validVideoId(value);
  if (bareId) return bareId;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const youtubeHost = ['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host);
  if (youtubeHost) {
    const pathMatch = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/);
    return validVideoId(url.searchParams.get('v')) ?? validVideoId(pathMatch?.[1]);
  }

  if (host === 'youtu.be') {
    return validVideoId(url.pathname.split('/').filter(Boolean)[0]);
  }

  return null;
}

export function getYouTubeStartSeconds(input: string): number | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const start = url.searchParams.get('start') ?? url.searchParams.get('t');
  if (!start) return null;
  if (/^\d+$/.test(start)) return Number(start);

  const match = start.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match || !match[0]) return null;

  const seconds =
    Number(match[1] || 0) * 3600 +
    Number(match[2] || 0) * 60 +
    Number(match[3] || 0);
  return seconds > 0 ? seconds : null;
}

export function getYouTubeEmbedUrl(videoId: string, startSeconds?: number | null): string | null {
  const validId = validVideoId(videoId);
  if (!validId) return null;

  const url = new URL(`https://www.youtube-nocookie.com/embed/${validId}`);
  url.searchParams.set('rel', '0');
  url.searchParams.set('modestbranding', '1');
  if (startSeconds && Number.isInteger(startSeconds) && startSeconds > 0) {
    url.searchParams.set('start', String(startSeconds));
  }
  return url.toString();
}
