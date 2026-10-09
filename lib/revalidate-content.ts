import { revalidatePath } from "next/cache";
import { servicesData } from "@/lib/services-data";

export function revalidateServiceContent(serviceId?: string) {
  revalidatePath("/");
  if (serviceId) {
    revalidatePath(`/services/${serviceId}`);
    return;
  }
  for (const service of servicesData) {
    revalidatePath(`/services/${service.id}`);
  }
}
