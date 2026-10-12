import type { Patient } from "../types";
import { apiGet } from "./client";

interface ApiPatient {
  id: string;
  name: string;
  phone: string;
  last_visit: string | null;
  primary_doctor_id: string | null;
}

export async function fetchPatients(): Promise<Patient[]> {
  const { items } = await apiGet<{ items: ApiPatient[] }>("/dashboard/patients");
  return items.map((p) => ({
    id: p.id,
    name: p.name,
    birthDate: "", // not collected by the booking agent
    phone: p.phone,
    lastVisit: p.last_visit,
    primaryDoctorId: p.primary_doctor_id ?? "",
  }));
}
