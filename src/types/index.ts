export type ReservationStatus = "booked" | "checked-in" | "in-progress" | "completed" | "cancelled";

export interface Doctor {
  id: string;
  name: string;
  department: string;
  workingDays: string[]; // e.g. ["mon", "tue", "wed"]
}

export interface Patient {
  id: string;
  name: string;
  birthDate: string; // ISO date
  phone: string;
  lastVisit: string | null; // ISO date
  primaryDoctorId: string;
}

export interface Reservation {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // HH:mm
  department: string;
  status: ReservationStatus;
  durationMinutes: number;
}

export interface TherapySession {
  id: string;
  therapist: string; // therapist staff are a separate resource from doctors
  patientId: string;
  doctorId: string; // referring/supervising doctor
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // HH:mm
  durationMinutes: number;
}

export type LogAction = "created" | "updated" | "cancelled";

export interface LogEntry {
  id: string;
  timestamp: string; // ISO datetime
  action: LogAction;
  reservationId: string;
  patientName: string;
  operator: string;
  // The slot as of this event; for "updated", where it moved from.
  doctorName?: string;
  startsAt?: string;
  prevStartsAt?: string | null;
}

export interface StaffUser {
  id: string;
  name: string;
  role: string;
}
