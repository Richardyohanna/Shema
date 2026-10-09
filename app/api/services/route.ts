import { NextResponse } from "next/server";
import { getServicesFromDatabase } from "@/lib/services-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = await getServicesFromDatabase();
  return NextResponse.json(services.filter((service) => service.published));
}
