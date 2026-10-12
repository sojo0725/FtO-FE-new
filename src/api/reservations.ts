import type { Reservation } from "../types";
import { apiGet } from "./client";

interface ApiReservation {
  appointment_id: string;
  status: "BOOKED" | "CANCELLED";
  patient: { id: string };
  doctor: { id: string; department: string };
  starts_at: string; // RFC3339 in clinic time, e.g. 2026-10-14T17:00:00+08:00
  ends_at: string;
}

interface Page {
  items: ApiReservation[];
  next_cursor: string | null;
}

function toReservation(r: ApiReservation): Reservation {
  return {
    id: r.appointment_id,
    patientId: r.patient.id,
    doctorId: r.doctor.id,
    // The backend stores clinic-local times, so the wall clock is in the string itself.
    date: r.starts_at.slice(0, 10),
    time: r.starts_at.slice(11, 16),
    department: r.doctor.department,
    status: r.status === "CANCELLED" ? "cancelled" : "booked",
    durationMinutes: Math.round((Date.parse(r.ends_at) - Date.parse(r.starts_at)) / 60000),
  };
}

export async function fetchReservations(): Promise<Reservation[]> {
  const all: ApiReservation[] = [];
  let cursor: string | null = null;
  do {
    const query: string = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
    const page: Page = await apiGet<Page>(`/dashboard/reservations?limit=100${query}`);
    all.push(...page.items);
    cursor = page.next_cursor;
  } while (cursor);
  return all.map(toReservation);
}
