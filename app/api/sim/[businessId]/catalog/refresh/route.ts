import { refreshEquipmentCatalog } from '@/lib/integrations/equipment-rtrvr';
import { rtrvrEnabled } from '@/lib/integrations/rtrvr-scrape';
import { fail, ok } from '@/lib/http';

/** POST — owner/dev: force RTRVR rescrape of 3D equipment seed pages. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  if (!rtrvrEnabled()) {
    return fail('RTRVR is disabled (set RTRVR_API_KEY and USE_MOCKS=false)', 503);
  }
  const catalog = await refreshEquipmentCatalog(businessId);
  return ok({ catalog });
}
