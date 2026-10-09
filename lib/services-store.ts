import { servicesData } from "@/lib/services-data";
import { mapImpactRecord, mapServiceRow, type ServiceItem } from "@/lib/services";
import { supabaseAdmin } from "@/lib/supabase-admin";

function mapStaticService(service: (typeof servicesData)[number], sortOrder: number): ServiceItem {
  return {
    id: service.id,
    slug: service.id,
    title: service.title,
    shortDescription: service.shortDescription,
    description: service.description,
    image: service.image,
    impact: mapImpactRecord(service.impact),
    gallery: service.gallery,
    sortOrder,
    published: true,
    createdAt: "",
  };
}

export const staticServiceRecords = servicesData.map(mapStaticService);

function isMissingServicesTable(code?: string): boolean {
  return code === "PGRST205" || code === "42P01";
}

export async function getServicesFromDatabase(includeUnpublished = false): Promise<ServiceItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      console.warn("Using static service records because the Supabase services query failed.", {
        operation: "select services",
        code: error.code,
        message: error.message,
        missingTable: isMissingServicesTable(error.code),
      });
      return staticServiceRecords;
    }
    if (!data?.length) {
      console.warn("Using static service records because no matching Supabase service rows were found.", {
        includeUnpublished,
      });
      return staticServiceRecords;
    }
    const services = data.map(mapServiceRow);
    return includeUnpublished ? services : services.filter((service) => service.published);
  } catch (error) {
    console.warn("Using static service records because the Supabase services query threw.", error);
    return staticServiceRecords;
  }
}

export async function getServiceFromDatabase(id: string): Promise<ServiceItem | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.warn("Using static service data because the Supabase service lookup failed.", {
        operation: "select service by id",
        code: error.code,
        message: error.message,
      });
    } else if (data) {
      const service = mapServiceRow(data);
      return service.published ? service : null;
    } else {
      console.warn("Using static service data because no matching Supabase service row was found.", { id });
    }
  } catch (error) {
    console.warn("Using static service data because the Supabase service lookup threw.", { id, error });
  }

  return staticServiceRecords.find((service) => service.id === id) ?? null;
}

export async function isValidServiceId(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!error) return Boolean(data);
    console.warn("Falling back to static service ids after service validation query failed.", {
      operation: "validate service id",
      code: error.code,
      message: error.message,
    });
  } catch (error) {
    console.warn("Falling back to static service ids after validation query threw.", error);
  }
  return servicesData.some((service) => service.id === id);
}
