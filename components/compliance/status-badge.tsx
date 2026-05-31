import { Badge } from '@/components/ui';
import type { AppliedLawStatus } from '@/types';
import type { OpseraScanStatus } from '@/lib/opsera/static-summary';

const lawTone: Record<
  AppliedLawStatus,
  'success' | 'warning' | 'danger'
> = {
  satisfied: 'success',
  needs_review: 'warning',
  flagged: 'danger',
};

const lawLabel: Record<AppliedLawStatus, string> = {
  satisfied: 'Satisfied',
  needs_review: 'Needs review',
  flagged: 'Flagged',
};

export function AppliedLawStatusBadge({ status }: { status: AppliedLawStatus }) {
  return <Badge tone={lawTone[status]}>{lawLabel[status]}</Badge>;
}

const scanTone: Record<OpseraScanStatus, 'success' | 'warning' | 'danger'> = {
  pass: 'success',
  review: 'warning',
  action: 'danger',
};

const scanLabel: Record<OpseraScanStatus, string> = {
  pass: 'Pass',
  review: 'Review',
  action: 'Action required',
};

export function OpseraScanStatusBadge({ status }: { status: OpseraScanStatus }) {
  return <Badge tone={scanTone[status]}>{scanLabel[status]}</Badge>;
}
