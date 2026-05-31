import type { User } from "@/types";

const STORAGE_KEY = "trainr_employee_session";

export type EmployeeSession = {
  user: User;
  businessId: string;
  coachSessionId?: string;
  language?: string;
};

export function saveEmployeeSession(session: EmployeeSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadEmployeeSession(): EmployeeSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EmployeeSession;
  } catch {
    return null;
  }
}

export function updateEmployeeSession(
  patch: Partial<EmployeeSession>,
): EmployeeSession | null {
  const current = loadEmployeeSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveEmployeeSession(next);
  return next;
}

export function clearEmployeeSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
