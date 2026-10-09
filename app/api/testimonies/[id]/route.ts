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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const { id } = await context.params;
    const { data, error } = await supabaseAdmin
      .from("testimonies")
      .update(databasePayload(parsed.data))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) {
      reportSupabaseFailure("update testimony", error);
      return NextResponse.json(
        { error: isSchemaMissing(error.code) ? "Run supabase/testimonies.sql before managing linked stories." : "Unable to update testimony." },
        { status: isSchemaMissing(error.code) ? 503 : 500 }
      );
    }
    if (!data) return NextResponse.json({ error: "Testimony not found." }, { status: 404 });
    revalidateServiceContent(parsed.data.service_id);
    return NextResponse.json(mapTestimonyRow(data));
  } catch (error) {
    console.error("PATCH /api/testimonies/[id] failed", error);
    return NextResponse.json({ error: "Unable to update testimony." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("testimonies")
      .select("service_id")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) {
      reportSupabaseFailure("read testimony before delete", lookupError);
      return NextResponse.json({ error: "Unable to find testimony." }, { status: 500 });
    }
    if (!existing) return NextResponse.json({ error: "Testimony not found." }, { status: 404 });
    const { error, count } = await supabaseAdmin
      .from("testimonies")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) {
      reportSupabaseFailure("delete testimony", error);
      return NextResponse.json(
        { error: isSchemaMissing(error.code) ? "Run supabase/testimonies.sql before managing linked stories." : "Unable to delete testimony." },
        { status: isSchemaMissing(error.code) ? 503 : 500 }
      );
    }
    if (!count) return NextResponse.json({ error: "Testimony not found." }, { status: 404 });
    revalidateServiceContent(existing.service_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/testimonies/[id] failed", error);
    return NextResponse.json({ error: "Unable to delete testimony." }, { status: 500 });
  }
}
