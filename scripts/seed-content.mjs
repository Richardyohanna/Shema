import { createClient } from "@supabase/supabase-js";
import { servicesData } from "../lib/services-data.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");
const forceServices = process.argv.includes("--force-services");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function stats() {
  return { inserted: 0, skipped: 0, failed: 0, updated: 0 };
}

const totals = {
  services: stats(),
  testimonies: stats(),
  events: stats(),
};

function logFailure(table, key, error) {
  totals[table].failed += 1;
  console.error(`Seed failed for ${table} row "${key}": ${error.message}`);
}

async function seedService(service, sortOrder) {
  const row = {
    id: service.id,
    title: service.title,
    short_description: service.shortDescription,
    description: service.description,
    image_url: service.image || null,
    impact: service.impact,
    gallery: service.gallery,
    sort_order: sortOrder,
    published: true,
  };

  const { data: existing, error: lookupError } = await supabase
    .from("services")
    .select("id")
    .eq("id", service.id)
    .maybeSingle();
  if (lookupError) {
    logFailure("services", service.id, lookupError);
    return;
  }

  if (dryRun) {
    if (existing && forceServices) totals.services.updated += 1;
    else if (existing) totals.services.skipped += 1;
    else totals.services.inserted += 1;
    return;
  }

  const { error } = await supabase
    .from("services")
    .upsert(row, { onConflict: "id", ignoreDuplicates: !forceServices });
  if (error) {
    logFailure("services", service.id, error);
  } else if (existing && forceServices) {
    totals.services.updated += 1;
  } else if (existing) {
    totals.services.skipped += 1;
  } else {
    totals.services.inserted += 1;
  }
}

async function seedTestimonies() {
  const sourceKeys = servicesData.flatMap((service) =>
    service.beneficiaryStories.map((story) => story.id)
  );
  const { data: existingRows, error: lookupError } = await supabase
    .from("testimonies")
    .select("source_key")
    .in("source_key", sourceKeys);
  if (lookupError) {
    logFailure("testimonies", "existing source_key lookup", lookupError);
    return;
  }

  const existingKeys = new Set(
    (existingRows ?? [])
      .map((row) => row.source_key)
      .filter((key) => typeof key === "string")
  );
  for (const service of servicesData) {
    for (const [displayOrder, story] of service.beneficiaryStories.entries()) {
      let alreadySeeded = existingKeys.has(story.id);
      let matchingLegacyRowId;
      if (!alreadySeeded) {
        const { data: legacyRow, error: legacyLookupError } = await supabase
          .from("testimonies")
          .select("id")
          .eq("service_id", service.id)
          .eq("name", story.name)
          .eq("title", story.name)
          .is("source_key", null)
          .maybeSingle();
        if (legacyLookupError) {
          logFailure("testimonies", `${story.id} legacy lookup`, legacyLookupError);
          continue;
        }
        alreadySeeded = Boolean(legacyRow);
        matchingLegacyRowId = legacyRow?.id;
      }
      if (alreadySeeded) {
        totals.testimonies.skipped += 1;
        if (matchingLegacyRowId !== undefined && !dryRun) {
          const { error } = await supabase
            .from("testimonies")
            .update({ source_key: story.id })
            .eq("id", matchingLegacyRowId)
            .is("source_key", null);
          if (error) logFailure("testimonies", `${story.id} source_key backfill`, error);
        }
        continue;
      }
      if (dryRun) {
        totals.testimonies.inserted += 1;
        continue;
      }

      const { error } = await supabase.from("testimonies").upsert({
        source_key: story.id,
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
        thumbnail_url: story.image || null,
        thumbnail_alt_text: story.name,
        display_order: displayOrder,
        published: true,
        service_id: service.id,
        event_id: null,
      }, {
        onConflict: "source_key",
        ignoreDuplicates: true,
      });
      if (error) logFailure("testimonies", story.id, error);
      else totals.testimonies.inserted += 1;
    }
  }
}

for (const [sortOrder, service] of servicesData.entries()) {
  await seedService(service, sortOrder);
}
await seedTestimonies();

console.log(`Seed summary (${dryRun ? "dry run" : "applied"}):`);
for (const [table, result] of Object.entries(totals)) {
  console.log(
    `${table}: inserted=${result.inserted}, skipped=${result.skipped}, updated=${result.updated}, failed=${result.failed}`
  );
}
console.log("events: no hardcoded events were found; no events were inserted.");
if (dryRun) console.log("Dry run only: no database rows were changed.");
if (Object.values(totals).some((result) => result.failed > 0)) process.exitCode = 1;
