"use client";

import { useState } from "react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type YouTubeEmbedProps = {
  videoId: string | null | undefined;
  title: string;
  startSeconds?: number | null;
  videoUrl?: string | null;
  initiallyPlaying?: boolean;
};

export function YouTubeEmbed({ videoId, title, startSeconds, videoUrl, initiallyPlaying = false }: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(initiallyPlaying);
  const baseEmbedUrl = videoId ? getYouTubeEmbedUrl(videoId, startSeconds) : null;
  const embedUrl = baseEmbedUrl
    ? (() => {
        const url = new URL(baseEmbedUrl);
        if (playing) url.searchParams.set("autoplay", "1");
        return url.toString();
      })()
    : null;

  if (!embedUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted p-4 text-center">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">This YouTube video link is invalid.</p>
          {videoUrl && (
            <a href={videoUrl} target="_blank" rel="noreferrer" className="underline">
              Watch on YouTube
            </a>
          )}
        </div>
      </div>
    );
  }

  if (playing) {
    return (
      <div className="aspect-video overflow-hidden rounded-lg">
        <iframe
          className="h-full w-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="group relative block aspect-video w-full overflow-hidden rounded-lg bg-black text-white"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
        loading="lazy"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-xl bg-red-600 px-5 py-3 text-lg font-semibold shadow-lg">Play</span>
      </span>
    </button>
  );
}
