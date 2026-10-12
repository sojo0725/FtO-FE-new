import type { LogAction, LogEntry } from "../types";
import { apiGet } from "./client";

interface ApiLog {
  id: number;
  timestamp: string;
  action: "CREATED" | "UPDATED" | "CANCELLED";
  appointment_id: string;
  patient_name: string;
  channel: "agent" | "staff";
}

export async function fetchLogs(): Promise<LogEntry[]> {
  const { items } = await apiGet<{ items: ApiLog[] }>("/dashboard/logs");
  return items.map((l) => ({
    id: String(l.id),
    timestamp: l.timestamp,
    action: l.action.toLowerCase() as LogAction,
    reservationId: l.appointment_id,
    patientName: l.patient_name,
    operator: l.channel, // translated as operator.agent / operator.staff
  }));
}
