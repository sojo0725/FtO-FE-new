import type { Doctor } from "../types";
import { apiGet } from "./client";

interface ApiDoctor {
  id: string;
  name: string;
  department: string;
  working_days: string[];
}

export async function fetchDoctors(): Promise<Doctor[]> {
  const { items } = await apiGet<{ items: ApiDoctor[] }>("/dashboard/doctors");
  return items.map((d) => ({ id: d.id, name: d.name, department: d.department, workingDays: d.working_days }));
}
