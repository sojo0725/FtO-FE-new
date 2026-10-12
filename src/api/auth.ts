import type { StaffUser } from "../types";
import { apiPost, tokenStore } from "./client";

export async function loginRequest(staffId: string, password: string): Promise<StaffUser | null> {
  const response = await apiPost("/auth/login", { staff_id: staffId, password });
  if (!response.ok) return null;
  const body = (await response.json()) as { token: string; user: StaffUser };
  tokenStore.set(body.token);
  return body.user;
}
