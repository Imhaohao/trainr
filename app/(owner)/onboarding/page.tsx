import { requireOwnerPage } from '@/lib/auth';
import { getDb } from '@/lib/contracts/db';
import OnboardingWizard from '@/components/owner/OnboardingWizard';

// Owner intake wizard. Loads the current owner's business + intake (when they
// already started) and hands them to the client wizard, which autosaves each
// step to /api/business/:id, /intake, and /files.
export default async function OnboardingPage() {
  const { business } = await requireOwnerPage();
  const db = getDb();
  const intake = business ? await db.intake.get(business.id) : null;
  const files = business ? await db.files.list({ businessId: business.id }) : [];

  return (
    <OnboardingWizard
      initialBusiness={business}
      initialIntake={intake}
      initialFiles={files}
    />
  );
}
