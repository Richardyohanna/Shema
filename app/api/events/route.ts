import { NextRequest, NextResponse } from "next/server";
import { eventInputSchema } from "@/lib/content-validation";
import { mapEventRow } from "@/lib/events";
import { eventPayload } from "@/lib/event-api";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isValidServiceId } from "@/lib/services-store";
import { revalidateServiceContent } from "@/lib/revalidate-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  if (!serviceId || !(await isValidServiceId(serviceId))) {
    return NextResponse.json({ error: "A valid serviceId is required." }, { status: 400 });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("service_id", serviceId)
      .eq("published", true)
      .order("date", { ascending: false });
    if (error) {
      console.error("GET /api/events failed", { operation: "select published events", code: error.code, message: error.message });
      return NextResponse.json({ error: "Unable to load events." }, { status: 500 });
    }
    return NextResponse.json((data ?? []).map(mapEventRow));
  } catch (error) {
    console.error("GET /api/events failed", error);
    return NextResponse.json({ error: "Unable to load events." }, { status: 500 });
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
  const { data, error } = await supabaseAdmin
    .from("events")
    .insert(eventPayload(parsed.data))
    .select("*")
    .single();
  if (error || !data) {
    console.error("POST /api/events failed", { operation: "insert event", code: error?.code, message: error?.message });
    const duplicateSlug = error?.code === "23505";
    return NextResponse.json(
      { error: duplicateSlug ? "An event with this slug already exists for that service." : "Unable to create event." },
      { status: duplicateSlug ? 409 : 500 }
    );
  }
  revalidateServiceContent(parsed.data.service_id);
  return NextResponse.json(mapEventRow(data), { status: 201 });
}
