import Link from 'next/link';
import { requireOwnerPage } from '@/lib/auth';
import { EmployeeHandoffCard } from '@/components/owner/EmployeeHandoffCard';

// Deploy & publish: after the publish pipeline runs, the owner lands here and
// gets the employee sign-in handoff (URL + join code).
export default async function DeployPage() {
  const { business } = await requireOwnerPage();

  if (!business) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Deploy &amp; publish</h1>
        <p className="text-muted">
          You haven&apos;t set up a business yet.{' '}
          <Link href="/onboarding" className="text-accent underline">
            Start the intake
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmployeeHandoffCard joinCode={business.joinCode} />
    </div>
  );
}
