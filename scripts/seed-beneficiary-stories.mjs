import { createClient } from "@supabase/supabase-js";
import { servicesData } from "../lib/services-data.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the seed.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
let createdCount = 0;

for (const service of servicesData) {
  for (const [index, story] of service.beneficiaryStories.entries()) {
    const { data: existing, error: lookupError } = await supabase
      .from("testimonies")
      .select("id")
      .eq("service_id", service.id)
      .eq("name", story.name)
      .eq("title", story.name)
      .maybeSingle();
    if (lookupError) throw new Error(`Could not check ${story.name}: ${lookupError.message}`);
    if (existing) continue;

    const { error } = await supabase.from("testimonies").insert({
      name: story.name,
      role: "Beneficiary story",
      title: story.name,
      description: story.story,
      summary: story.story,
      full_story: story.fullStory,
      image_url: story.image || null,
      video_url: null,
      video_id: null,
      video_source: "url",
      thumbnail_url: null,
      thumbnail_alt_text: "",
      display_order: index,
      published: true,
      service_id: service.id,
      event_id: null,
    });
    if (error) throw new Error(`Could not seed ${story.name}: ${error.message}`);
    createdCount += 1;
  }
}

console.log(`Seeded ${createdCount} beneficiary stories.`);
