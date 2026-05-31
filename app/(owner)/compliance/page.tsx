import { requireOwnerPage } from '@/lib/auth';
import { loadComplianceReport } from '@/lib/compliance/report';
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';
import { ComplianceEmptyState } from '@/components/compliance/ComplianceEmptyState';

export default async function CompliancePage() {
  const { business } = await requireOwnerPage();

  if (!business) {
    return <ComplianceEmptyState />;
  }

  const report = await loadComplianceReport(business.id);
  if (!report) {
    return <ComplianceEmptyState />;
  }

  return (
    <ComplianceDashboard report={report} businessName={business.name} />
  );
}
