import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { mapEventRow } from "@/lib/events";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isValidServiceId } from "@/lib/services-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  if (serviceId && !(await isValidServiceId(serviceId))) {
    return NextResponse.json({ error: "Invalid serviceId." }, { status: 400 });
  }
  try {
    let query = supabaseAdmin.from("events").select("*").order("date", { ascending: false });
    if (serviceId) query = query.eq("service_id", serviceId);
    const { data, error } = await query;
    if (error) {
      console.error("GET /api/events/admin failed", { operation: "select events for admin", code: error.code, message: error.message });
      return NextResponse.json({ error: "Unable to load events. Confirm supabase/testimonies.sql was applied." }, { status: 500 });
    }
    return NextResponse.json((data ?? []).map(mapEventRow));
  } catch (error) {
    console.error("GET /api/events/admin failed", error);
    return NextResponse.json({ error: "Unable to load events." }, { status: 500 });
  }
}
