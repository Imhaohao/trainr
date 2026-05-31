// GET /api/progress/:employeeId -> { progress: EmployeeProgress[] }
// Phase 0 STUB — owner: T3. Reads progress rows for an employee.

import { getDb } from '@/lib/contracts/db';
import { ok } from '@/lib/http';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  const { employeeId } = await params;
  const progress = await getDb().progress.list({ employeeId });
  return ok({ progress });
}
