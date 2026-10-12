import type { TherapySession } from "../types";

// The backend has no therapy sessions yet; show none rather than invented ones.
export async function fetchTherapySessions(): Promise<TherapySession[]> {
  return [];
}
