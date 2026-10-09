import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const events = [
  {
    title: "SHEMA Visit to Kulda Community",
    slug: "shema-visit-to-kulda-community",
    date: "2025-07-06",
    location: "Kulda Community",
    description: "Food and non-food items distributed with counseling support to households affected by insurgency.",
    service_id: "practical-support",
    published: true,
  },
  {
    title: "Widows Support Program",
    slug: "widows-support-program",
    date: "",
    location: "Gombi 1 Primary School",
    description: "",
    service_id: "financial-support",
    published: true,
  },
];

const testimonies = [
  {
    name: "Widows Support Program",
    role: "Widows Support Program",
    title: "Finding Hope After Crisis",
    video_url: "https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001484421.mp4",
    description: "Widows celebrating SHEMA's visit and ongoing support.",
    summary: "Widows celebrating SHEMA's visit and ongoing support.",
    thumbnail_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1001069628.jpg-8cYMLLBTQKctxoncjb3a6MnAcFQxvK.jpeg",
    service_id: "financial-support",
    event_title: "Widows Support Program",
    video_id: null,
    video_source: "url",
    thumbnail_alt_text: "",
    full_story: "",
    image_url: null,
    display_order: 1,
    published: true,
  },
  {
    name: "SHEMA Visit to Kulda Community",
    role: "Community Outreach",
    title: "Humanitarian Support in Kulda",
    video_url: "https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1c9cfbfb-89f0-47db-a9bd-385f08435cb3.mov",
    description: "SHEMA visited Kulda — an area affected by Boko Haram insurgency — assessing needs and providing practical aid to affected families.",
    summary: "SHEMA visited Kulda — an area affected by Boko Haram insurgency — assessing needs and providing practical aid to affected families.",
    thumbnail_url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1001117168.jpg-ie0qZ4nXD5wy0CTxkT8lmhe9yg0zTK.jpeg",
    service_id: "practical-support",
    event_title: "SHEMA Visit to Kulda Community",
    video_id: null,
    video_source: "url",
    thumbnail_alt_text: "",
    full_story: "",
    image_url: null,
    display_order: 2,
    published: true,
  },
];

const totals = {
  events: { inserted: 0, skipped: 0, failed: 0 },
  testimonies: { inserted: 0, skipped: 0, failed: 0 },
};
const eventIds = new Map();
const availableEventTitles = new Set();

function recordFailure(kind, label, error) {
  totals[kind].failed += 1;
  console.error(`Failed ${kind} row "${label}": ${error.message}`);
}

async function seedEvent(event) {
  const { data: existing, error: lookupError } = await supabase
    .from("events")
    .select("id")
    .eq("title", event.title)
    .eq("service_id", event.service_id)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) {
    totals.events.skipped += 1;
    eventIds.set(event.title, existing.id);
    availableEventTitles.add(event.title);
    return;
  }
  if (dryRun) {
    totals.events.inserted += 1;
    availableEventTitles.add(event.title);
    return;
  }

  const { data, error } = await supabase
    .from("events")
    .insert(event)
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("No event row was returned after insert.");
  totals.events.inserted += 1;
  eventIds.set(event.title, data.id);
  availableEventTitles.add(event.title);
}

async function seedTestimony(testimony) {
  const { data: existing, error: lookupError } = await supabase
    .from("testimonies")
    .select("id")
    .eq("video_url", testimony.video_url)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) {
    totals.testimonies.skipped += 1;
    return;
  }
  if (!availableEventTitles.has(testimony.event_title)) {
    throw new Error(`The linked event "${testimony.event_title}" could not be seeded.`);
  }
  if (dryRun) {
    totals.testimonies.inserted += 1;
    return;
  }

  const eventId = eventIds.get(testimony.event_title);
  if (!eventId) throw new Error(`The linked event "${testimony.event_title}" is unavailable.`);

  const { event_title: _eventTitle, ...row } = testimony;
  const { error } = await supabase
    .from("testimonies")
    .insert({ ...row, event_id: eventId });

  if (error) throw error;
  totals.testimonies.inserted += 1;
}

for (const event of events) {
  try {
    await seedEvent(event);
  } catch (error) {
    recordFailure("events", `${event.title} (${event.service_id})`, error);
  }
}

for (const testimony of testimonies) {
  try {
    await seedTestimony(testimony);
  } catch (error) {
    recordFailure("testimonies", testimony.video_url, error);
  }
}

console.log(`Seed summary (${dryRun ? "dry run" : "applied"}):`);
for (const [kind, result] of Object.entries(totals)) {
  console.log(
    `${kind}: inserted=${result.inserted}, skipped=${result.skipped}, failed=${result.failed}`
  );
}
if (dryRun) console.log("Dry run only: no database rows were changed.");
if (Object.values(totals).some((result) => result.failed > 0)) process.exitCode = 1;
