import { z } from "zod";
import { getYouTubeId } from "@/lib/youtube";

const serviceIdSchema = z.string().trim().min(1, "Choose a service.").max(120);

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isDirectVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      /\.(mp4|mov|webm|ogg|m4v)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

const optionalHttpUrl = z.union([z.literal(""), z.null(), z.string().url().refine(isHttpUrl)]).transform(
  (value) => value || null
);

export const testimonyInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  role: z.string().trim().max(200).default(""),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(10000).default(""),
  summary: z.string().trim().max(10000).optional(),
  full_story: z.string().trim().max(30000).default(""),
  image_url: optionalHttpUrl.default(""),
  video_url: z.union([
    z.literal(""),
    z.string().trim().url().refine(isHttpUrl, "Video URL must use HTTP or HTTPS."),
  ]).default("").transform((value) => value || null),
  video_source: z.enum(["upload", "url"]),
  thumbnail_url: optionalHttpUrl.default(""),
  thumbnail_alt_text: z.string().trim().max(500).default(""),
  display_order: z.number().int().min(0).max(100000),
  published: z.boolean().default(true),
  service_id: serviceIdSchema,
  event_id: z.union([z.string().uuid(), z.literal(""), z.null()]).default(null),
}).superRefine((value, context) => {
  if (!value.summary && !value.description) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["summary"],
      message: "Add a short summary for this testimony.",
    });
  }
  if (value.video_source === "upload" && (!value.video_url || !isDirectVideoUrl(value.video_url))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["video_url"],
      message: "Uploaded videos must use a direct video file URL.",
    });
  }
  const host = (() => {
    try {
      return value.video_url ? new URL(value.video_url).hostname.toLowerCase().replace(/^www\./, "") : "";
    } catch {
      return "";
    }
  })();
  if (
    value.video_url &&
    ["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"].includes(host) &&
    !getYouTubeId(value.video_url)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["video_url"],
      message: "Enter a valid YouTube video URL.",
    });
  }
});

export const eventInputSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: z.string().trim().min(1).max(300).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
  date: z.string().trim().min(1).max(100),
  location: z.string().trim().max(300).default(""),
  description: z.string().trim().max(10000).default(""),
  cover_image_url: optionalHttpUrl.default(""),
  gallery: z.array(z.string().url().refine(isHttpUrl)).max(100).default([]),
  service_id: serviceIdSchema,
  published: z.boolean().default(true),
});

export type TestimonyInput = z.infer<typeof testimonyInputSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
