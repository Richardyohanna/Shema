import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { eventInputSchema } from "@/lib/content-validation";
import { eventPayload } from "@/lib/event-api";
import { mapEventRow } from "@/lib/events";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isValidServiceId } from "@/lib/services-store";
import { revalidateServiceContent } from "@/lib/revalidate-content";

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
  const parsed = eventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid event details.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  if (!(await isValidServiceId(parsed.data.service_id))) {
    return NextResponse.json({ error: "Choose a valid service." }, { status: 400 });
  }
  try {
    const { id } = await context.params;
    const { data, error } = await supabaseAdmin
      .from("events")
      .update(eventPayload(parsed.data))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) {
      console.error("PATCH /api/events/[id] failed", { operation: "update event", code: error.code, message: error.message });
      return NextResponse.json({ error: error.code === "23505" ? "An event with this slug already exists for that service." : "Unable to update event." }, { status: error.code === "23505" ? 409 : 500 });
    }
    if (!data) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    revalidateServiceContent(parsed.data.service_id);
    return NextResponse.json(mapEventRow(data));
  } catch (error) {
    console.error("PATCH /api/events/[id] failed", error);
    return NextResponse.json({ error: "Unable to update event." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("events")
      .select("service_id")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) {
      console.error("DELETE /api/events/[id] lookup failed", { operation: "read event before delete", code: lookupError.code, message: lookupError.message });
      return NextResponse.json({ error: "Unable to find event." }, { status: 500 });
    }
    if (!existing) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    const { error, count } = await supabaseAdmin
      .from("events")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) {
      console.error("DELETE /api/events/[id] failed", { operation: "delete event", code: error.code, message: error.message });
      return NextResponse.json({ error: "Unable to delete event." }, { status: 500 });
    }
    if (!count) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    revalidateServiceContent(existing.service_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/events/[id] failed", error);
    return NextResponse.json({ error: "Unable to delete event." }, { status: 500 });
  }
}
