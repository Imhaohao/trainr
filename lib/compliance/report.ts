import { getDb } from '@/lib/contracts/db';
import { OPSERA_GOVERNANCE_SUMMARY } from '@/lib/opsera/static-summary';
import type { AppliedLaw, ComplianceSnapshot } from '@/types';

export interface ComplianceReport {
  snapshot: ComplianceSnapshot;
  laws: AppliedLaw[];
  moduleTitles: Record<string, string>;
  history: Pick<ComplianceSnapshot, 'id' | 'programVersion' | 'generatedAt'>[];
  opsera: typeof OPSERA_GOVERNANCE_SUMMARY;
}

export async function loadComplianceReport(
  businessId: string,
): Promise<ComplianceReport | null> {
  const db = getDb();
  const snapshots = (await db.compliance.list({ businessId })).sort(
    (a, b) =>
      b.programVersion - a.programVersion ||
      Date.parse(b.generatedAt) - Date.parse(a.generatedAt),
  );
  const snapshot = snapshots[0];
  if (!snapshot) return null;

  const programs = await db.programs.list({ businessId });
  const program =
    programs.find((p) => p.version === snapshot.programVersion) ??
    programs.sort((a, b) => b.version - a.version)[0];

  const moduleTitles: Record<string, string> = {};
  for (const mod of program?.modules ?? []) {
    moduleTitles[mod.id] = mod.title;
  }

  return {
    snapshot,
    laws: snapshot.appliedLaws,
    moduleTitles,
    history: snapshots.map(({ id, programVersion, generatedAt }) => ({
      id,
      programVersion,
      generatedAt,
    })),
    opsera: OPSERA_GOVERNANCE_SUMMARY,
  };
}

export function resolveModuleLabels(
  moduleIds: string[],
  moduleTitles: Record<string, string>,
): { id: string; title: string }[] {
  return moduleIds.map((id) => ({
    id,
    title: moduleTitles[id] ?? id.replace(/^mod_/, '').replace(/_/g, ' '),
  }));
}
