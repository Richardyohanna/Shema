'use client'

import { useRef, useState } from 'react'

interface Testimony {
  id: number
  name: string
  role: string
  title: string
  videoUrl: string
  description: string
  /**
   * Optional thumbnail image shown before play.
   * If omitted, a dark green poster with the title is shown instead.
   */
  thumbnail?: string
}

const testimonies: Testimony[] = [
  {
    id: 1,
    name: 'Widows Support Program',
    role: 'Widows Support Program',
    title: 'Finding Hope After Crisis',
    videoUrl:
      'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001484421.mp4',
    description: "Widows celebrating SHEMA's visit and ongoing support.",
    // Drop a real image URL here, e.g. thumbnail: '/images/widows-thumbnail.jpg'
    thumbnail: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1001069628.jpg-8cYMLLBTQKctxoncjb3a6MnAcFQxvK.jpeg",
  },
  {
    id: 2,
    name: 'SHEMA Visit to Kulda Community',
    role: 'Community Outreach',
    title: 'Humanitarian Support in Kulda',
    videoUrl:
      'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1c9cfbfb-89f0-47db-a9bd-385f08435cb3.mov',
    description:
      'SHEMA visited Kulda — an area affected by Boko Haram insurgency — assessing needs and providing practical aid to affected families.',
    thumbnail: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1001117168.jpg-ie0qZ4nXD5wy0CTxkT8lmhe9yg0zTK.jpeg",
  },
]

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

/** Poster overlay shown before the user presses play */
function VideoPoster({
  testimony,
  onPlay,
}: {
  testimony: Testimony
  onPlay: () => void
}) {
  return (
    <button
      onClick={onPlay}
      className="group absolute inset-0 z-10 flex w-full flex-col items-center justify-center text-center"
      aria-label={`Play video: ${testimony.title}`}
    >
      {/* Background — real thumbnail or dark green fallback */}
      {testimony.thumbnail ? (
        <img
          src={testimony.thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 bg-[#0f2218]" aria-hidden="true" />
      )}

      {/* Gradient overlay so text is always readable */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10"
        aria-hidden="true"
      />

      {/* Centre content */}
      <div className="relative flex flex-col items-center gap-4 px-6">
        {/* Animated play button */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 bg-primary/90 shadow-lg transition-transform duration-200 group-hover:scale-110 group-hover:bg-primary">
          <BigPlayIcon />
        </div>

        {/* Role + Title */}
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
            {testimony.role}
          </p>
          <p className="text-lg font-semibold leading-snug text-white drop-shadow">
            {testimony.title}
          </p>
        </div>
      </div>

      {/* "Watch story" badge — bottom left */}
      <div className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
        <SmallPlayIcon />
        Watch story
      </div>
    </button>
  )
}

export default function Testimonies() {
  const [selected, setSelected] = useState<Testimony>(testimonies[0])
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function handleSelect(testimony: Testimony) {
    setPlaying(false)
    setSelected(testimony)
  }

  function handlePlay() {
    setPlaying(true)
    setTimeout(() => {
      videoRef.current?.play()
    }, 50)
  }

  return (
    <section className="w-full bg-background py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
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

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">

          {/* Main Player */}
          <div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              {/* Video element — always mounted for instant switching */}
              <video
                ref={videoRef}
                key={selected.videoUrl}
                controls={playing}
                preload="metadata"
                className="h-full w-full"
              >
                <source src={selected.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Poster overlay — hidden once user hits play */}
              {!playing && (
                <VideoPoster testimony={selected} onPlay={handlePlay} />
              )}
            </div>

            {/* Meta */}
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
          </div>

          {/* Sidebar */}
          <div className="flex flex-row gap-3 overflow-x-auto lg:flex-col lg:overflow-x-visible">
            <p className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground lg:block">
              More stories
            </p>

            {testimonies.map((testimony, index) => (
              <button
                key={testimony.id}
                onClick={() => handleSelect(testimony)}
                className={`min-w-[150px] cursor-pointer overflow-hidden rounded-xl border bg-card text-left transition-colors lg:min-w-0 ${
                  selected.id === testimony.id
                    ? 'border-primary'
                    : 'border-border hover:border-primary'
                }`}
              >
                {/* Sidebar thumbnail */}
                <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-[#0f2218]">
                  {testimony.thumbnail && (
                    <img
                      src={testimony.thumbnail}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-60"
                      aria-hidden="true"
                    />
                  )}
                  <span className="absolute left-2 top-2 text-[10px] text-white/60">
                    0{index + 1}
                  </span>
                  <div
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105 ${
                      selected.id === testimony.id
                        ? 'bg-primary/80'
                        : 'bg-primary'
                    }`}
                  >
                    <SmallPlayIcon />
                  </div>
                </div>

                {/* Active indicator bar */}
                <div
                  className={`h-[2.5px] transition-colors ${
                    selected.id === testimony.id
                      ? 'bg-primary'
                      : 'bg-transparent'
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

        {/* Divider */}
        <div className="mt-12 h-px bg-border" />
      </div>
    </section>
  )
}