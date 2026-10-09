import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { testimonyInputSchema } from "@/lib/content-validation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapTestimonyRow } from "@/lib/testimonies";
import { isValidServiceId } from "@/lib/services-store";
import { revalidateServiceContent } from "@/lib/revalidate-content";
import {
  databasePayload,
  ensureEventMatchesService,
  isSchemaMissing,
  reportSupabaseFailure,
} from "@/lib/testimonies-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("testimonies")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      reportSupabaseFailure("select published testimonies", error);
      return NextResponse.json(
        { error: "Unable to load testimonies. Check the database migration and server logs." },
        { status: isSchemaMissing(error.code) ? 503 : 500 }
      );
    }
    return NextResponse.json((data ?? []).map(mapTestimonyRow).filter(Boolean));
  } catch (error) {
    console.error("GET /api/testimonies failed", error);
    return NextResponse.json({ error: "Unable to load testimonies." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = testimonyInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid testimony details.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    if (!(await isValidServiceId(parsed.data.service_id))) {
      return NextResponse.json({ error: "Choose a valid service." }, { status: 400 });
    }
    const eventCheck = await ensureEventMatchesService(parsed.data.event_id || null, parsed.data.service_id);
    if (eventCheck.error) {
      reportSupabaseFailure("verify testimony event and service", eventCheck.error);
      return NextResponse.json({ error: "Unable to verify the selected event." }, { status: 500 });
    }
    if (!eventCheck.valid) {
      return NextResponse.json({ error: "Choose an event that belongs to the selected service." }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("testimonies")
      .insert(databasePayload(parsed.data))
      .select("*")
      .single();
    if (error || !data) {
      if (error) reportSupabaseFailure("insert testimony", error);
      return NextResponse.json(
        { error: error && isSchemaMissing(error.code) ? "Run supabase/testimonies.sql before managing linked stories." : "Unable to create testimony." },
        { status: error && isSchemaMissing(error.code) ? 503 : 500 }
      );
    }
    revalidateServiceContent(parsed.data.service_id);
    return NextResponse.json(mapTestimonyRow(data), { status: 201 });
  } catch (error) {
    console.error("POST /api/testimonies failed", error);
    return NextResponse.json({ error: "Unable to create testimony." }, { status: 500 });
  }
}
