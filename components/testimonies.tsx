'use client'

import { useEffect, useRef, useState } from 'react'
import type { Testimony } from '@/lib/testimonies'
import { getYouTubeEmbedUrl, getYouTubeId, getYouTubeStartSeconds } from '@/lib/youtube'
import { YouTubeEmbed } from '@/components/youtube-embed'

function getVideoUrl(testimony: Testimony): string {
  return testimony.videoUrl || ''
}

function getVideoEmbedUrl(url: string): string | null {
  const youtubeId = getYouTubeId(url)
  if (youtubeId) return getYouTubeEmbedUrl(youtubeId, getYouTubeStartSeconds(url))
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1)
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = parsed.pathname.match(/\/(?:video\/)?(\d+)/)?.[1]
      return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : null
    }
  } catch {
    return null
  }

  return null
}

function isDirectVideoUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) && /\.(mp4|mov|webm|ogg|m4v)(?:[?#].*)?$/i.test(url)
}

function BigPlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 translate-x-[2px] fill-white"
      aria-hidden="true"
    >
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function SmallPlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3 translate-x-[1px] fill-white"
      aria-hidden="true"
    >
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function VideoPoster({
  testimony,
  onPlay,
}: {
  testimony: Testimony
  onPlay: () => void
}) {
  const videoId = testimony.videoId || (testimony.videoUrl ? getYouTubeId(testimony.videoUrl) : null)
  const thumbnail = testimony.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null)

  return (
    <button
      onClick={onPlay}
      className="group absolute inset-0 z-10 flex w-full flex-col items-center justify-center text-center"
      aria-label={`Play video: ${testimony.title}`}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={testimony.thumbnailAltText || ''}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 bg-[#0f2218]" aria-hidden="true" />
      )}

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10"
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center gap-4 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 bg-primary/90 shadow-lg transition-transform duration-200 group-hover:scale-110 group-hover:bg-primary">
          <BigPlayIcon />
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
            {testimony.role}
          </p>
          <p className="text-lg font-semibold leading-snug text-white drop-shadow">
            {testimony.title}
          </p>
        </div>
      </div>

      <div className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
        <SmallPlayIcon />
        Watch story
      </div>
    </button>
  )
}

export default function Testimonies() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [selected, setSelected] = useState<Testimony | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let isMounted = true

    async function loadTestimonies() {
      try {
        setLoading(true)
        setFetchError(null)

        const response = await fetch('/api/testimonies', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Unable to load testimonies.')
        }

        if (!Array.isArray(data)) {
          throw new Error('The testimony response was invalid.')
        }

        const nextTestimonies = data as Testimony[]

        if (!isMounted) return

        setTestimonies(nextTestimonies)
        setSelected((current) => nextTestimonies.find((item) => item.id === current?.id) ?? nextTestimonies[0] ?? null)
      } catch (error) {
        if (!isMounted) return

        setTestimonies([])
        setSelected(null)
        setFetchError(error instanceof Error ? error.message : 'Unable to load the latest testimonies right now.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadTestimonies()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!videoRef.current) return

    videoRef.current.pause()
    videoRef.current.currentTime = 0
    videoRef.current.load()
    setPlaying(false)
  }, [selected?.id])

  function handleSelect(testimony: Testimony) {
    setFetchError(null)
    setSelected(testimony)
  }

  function handlePlay() {
    const currentVideo = selected ? getVideoUrl(selected) : ''

    if (!currentVideo) {
      setFetchError('This testimony does not have a playable video attached.')
      return
    }

    const embeddedVideo = getVideoEmbedUrl(currentVideo)
    if (!isDirectVideoUrl(currentVideo) && !embeddedVideo) {
      setFetchError('This video source cannot be played in the browser.')
      return
    }

    setFetchError(null)
    setPlaying(true)

    if (isDirectVideoUrl(currentVideo)) {
      setTimeout(() => {
        void videoRef.current?.play().catch(() => {
          setFetchError('Playback is unavailable for this video source.')
        })
      }, 50)
    }
  }

  const activeVideo = selected ? getVideoUrl(selected) : ''
  const canPlayVideo = Boolean(activeVideo && isDirectVideoUrl(activeVideo))
  const embedUrl = activeVideo ? getVideoEmbedUrl(activeVideo) : null
  const youtubeId = activeVideo ? getYouTubeId(activeVideo) : null

  if (!loading && !testimonies.length) {
    return (
      <section className="w-full bg-background py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Testimonies
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              {fetchError ? 'Stories are temporarily unavailable' : 'No stories available yet'}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {fetchError || 'Check back soon for updates from our supported communities.'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full bg-background py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Testimonies
          </p>
          <h2 className="mb-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Hear from those we{' '}
            <span className="text-primary">have supported</span>
          </h2>
          <p className="mx-auto max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Real stories of transformation and hope from individuals whose lives
            have been touched by SHEMA&apos;s work.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            Loading testimonies…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
            <div>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                {selected && canPlayVideo ? (
                  <video
                    ref={videoRef}
                    key={selected.id}
                    src={activeVideo}
                    controls
                    playsInline
                    preload="metadata"
                    poster={selected.thumbnail}
                    className="h-full w-full"
                    onError={() => setFetchError('Playback is unavailable for this video source.')}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : selected && youtubeId && playing ? (
                  <YouTubeEmbed
                    key={selected.id}
                    videoId={youtubeId}
                    title={selected.title}
                    startSeconds={getYouTubeStartSeconds(activeVideo)}
                    videoUrl={activeVideo}
                    initiallyPlaying
                  />
                ) : selected && embedUrl && playing ? (
                  <iframe
                    key={selected.id}
                    src={embedUrl}
                    title={selected.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#0f2218] text-center text-white/80">
                    No video available for this story.
                  </div>
                )}

                {!playing && selected && (canPlayVideo || embedUrl) && (
                  <VideoPoster testimony={selected} onPlay={handlePlay} />
                )}

                {!playing && selected && !canPlayVideo && !embedUrl && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/75 px-6 text-center text-white">
                    <div>
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
                        {selected.role}
                      </p>
                      <p className="text-lg font-semibold">{selected.title}</p>
                      <p className="mt-3 text-sm text-white/75">
                        This source cannot be played directly in the browser.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {fetchError && testimonies.length > 0 && (
                <p className="mt-3 text-sm text-red-600">{fetchError}</p>
              )}

              {selected && (
                <div className="mt-4 border-l-[3px] border-primary pl-4">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
                    {selected.role}
                  </p>
                  <h3 className="mb-1.5 text-lg font-semibold text-foreground">
                    {selected.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selected.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-row gap-3 overflow-x-auto lg:flex-col lg:overflow-x-visible">
              <p className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground lg:block">
                More stories
              </p>

              {testimonies.map((testimony, index) => (
                <button
                  key={testimony.id}
                  onClick={() => handleSelect(testimony)}
                  className={`min-w-[150px] cursor-pointer overflow-hidden rounded-xl border bg-card text-left transition-colors lg:min-w-0 ${
                    selected?.id === testimony.id ? 'border-primary' : 'border-border hover:border-primary'
                  }`}
                >
                  <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-[#0f2218]">
                    {testimony.thumbnail && (
                      <img
                        src={testimony.thumbnail}
                        alt={testimony.thumbnailAltText || ''}
                        className="absolute inset-0 h-full w-full object-cover opacity-60"
                        aria-hidden="true"
                      />
                    )}
                    <span className="absolute left-2 top-2 text-[10px] text-white/60">
                      0{index + 1}
                    </span>
                    <div
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105 ${
                        selected?.id === testimony.id ? 'bg-primary/80' : 'bg-primary'
                      }`}
                    >
                      <SmallPlayIcon />
                    </div>
                  </div>

                  <div
                    className={`h-[2.5px] transition-colors ${
                      selected?.id === testimony.id ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />

                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                      {testimony.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {testimony.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 h-px bg-border" />
      </div>
    </section>
  )
}