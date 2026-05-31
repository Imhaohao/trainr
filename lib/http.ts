// Shared API response helpers. Every route returns { ok:true,data } or
// { ok:false,error } per PLAN §5.

import { NextResponse } from 'next/server';
import type { ApiResponse } from '../types/index';

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  error: string,
  status = 400,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ ok: false, error }, { status });
}

// Parse a JSON body, tolerating empty/invalid bodies (returns {} ).
export async function readJson<T = Record<string, unknown>>(
  req: Request,
): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
