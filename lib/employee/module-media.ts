import { getDb } from '@/lib/contracts/db';
import { getStorage } from '@/lib/contracts/storage';
import { resolveEquipmentSim } from '@/lib/employee/equipment';
import type { RtrvrScrapedTab } from '@/lib/integrations/rtrvr-scrape';
import { pickPreviewImage } from '@/lib/integrations/rtrvr-scrape';
import { tigrisKeys } from '@/lib/integrations/tigris';
import type { TrainingModule } from '@/types';
import type { EquipmentMachineAsset } from '@/types/training';

export type ModuleMediaImage = {
  url: string;
  alt: string;
  source: 'research' | 'equipment';
  credit?: string;
};

export type ModuleMediaModel = {
  id: string;
  name: string;
  previewUrl?: string;
  productUrl?: string;
  glbUrl?: string;
  provider?: string;
};

export type ModuleMedia = {
  images: ModuleMediaImage[];
  models: ModuleMediaModel[];
};

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)(\?|$)/i;

function collectImageUrlsFromTab(tab: RtrvrScrapedTab): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const preview = pickPreviewImage(tab);
  if (preview && !seen.has(preview)) {
    seen.add(preview);
    out.push(preview);
  }

  for (const href of Object.values(tab.elementLinkRecord ?? {})) {
    if (!href || seen.has(href)) continue;
    if (IMAGE_EXT.test(href) || /\/image|thumbnail|preview|product-image/i.test(href)) {
      seen.add(href);
      out.push(href);
    }
  }
  return out.slice(0, 8);
}

async function imagesFromArtifactIds(
  businessId: string,
  artifactIds: string[],
): Promise<ModuleMediaImage[]> {
  if (artifactIds.length === 0) return [];

  const db = getDb();
  const storage = getStorage();
  const images: ModuleMediaImage[] = [];
  const seen = new Set<string>();

  for (const id of artifactIds) {
    const row = await db.research.get(id);
    if (!row || row.businessId !== businessId) continue;

    try {
      const buf = await storage.getObject(row.structuredKey);
      const payload = JSON.parse(buf.toString('utf8')) as { tab?: RtrvrScrapedTab };
      const tab = payload.tab;
      if (!tab) continue;

      for (const url of collectImageUrlsFromTab(tab)) {
        if (seen.has(url)) continue;
        seen.add(url);
        images.push({
          url,
          alt: row.title,
          source: 'research',
          credit: row.source,
        });
      }
    } catch {
      // Missing mock storage payload — skip silently.
    }
  }

  return images;
}

/**
 * Broad keyword check: does this text mention any boba-bar machine at all?
 * Used as a cheap pre-filter before hitting the equipment catalog.
 */
const MACHINE_KEYWORDS_RE =
  /\b(sealer?|seal(ing)?\s*machine|shaker?|pearl\s*cooker|tea\s*brewer|brewer|fructose|dispenser|cup\s*press|cup\s*seal|boba\s*machine|blender|equipment|machine)\b/i;

/**
 * Filter an asset list to those whose name / category / id / propName appear
 * in the given markdown text.  Used to show only the machines a module
 * actually mentions rather than the full catalog.
 */
function filterAssetsByContent(
  assets: EquipmentMachineAsset[],
  contentMarkdown: string,
): EquipmentMachineAsset[] {
  const lower = contentMarkdown.toLowerCase();
  return assets.filter((asset) => {
    const terms = [
      asset.name,
      asset.category,
      asset.id.replace(/_/g, ' '),
      asset.propName,
    ].filter((t): t is string => Boolean(t));
    return terms.some((t) => lower.includes(t.toLowerCase()));
  });
}

/**
 * Given a resolved asset list, check Tigris for uploaded GLBs and build the
 * ModuleMedia output.  Pure I/O — no sim resolution happens here.
 */
async function buildModelsFromAssets(
  businessId: string,
  assets: EquipmentMachineAsset[],
): Promise<{ images: ModuleMediaImage[]; models: ModuleMediaModel[] }> {
  if (!assets.length) return { images: [], models: [] };

  const storage = getStorage();
  const images: ModuleMediaImage[] = [];
  const models: ModuleMediaModel[] = [];
  const seenImg = new Set<string>();

  for (const asset of assets) {
    let glbUrl: string | undefined;
    const glbKey = tigrisKeys.equipmentModel(businessId, asset.id);
    try {
      await storage.getObject(glbKey);
      glbUrl = await storage.getSignedUrl(glbKey, 3600);
    } catch {
      glbUrl = undefined;
    }

    // If the catalog has a direct preview image use it.  Otherwise build an
    // /api/og-image proxy URL so the showcase can still show something while
    // the user hasn't uploaded a GLB yet.
    const previewUrl =
      asset.previewImageUrl ??
      (asset.productUrl
        ? `/api/og-image?url=${encodeURIComponent(asset.productUrl)}`
        : undefined);

    models.push({
      id: asset.id,
      name: asset.name,
      previewUrl,
      productUrl: asset.productUrl,
      glbUrl,
      provider: asset.provider,
    });

    if (previewUrl && !seenImg.has(previewUrl)) {
      seenImg.add(previewUrl);
      images.push({
        url: previewUrl,
        alt: asset.name,
        source: 'equipment',
        credit: asset.provider,
      });
    }
  }

  return { images, models };
}

/** Photos + 3D model metadata for an employee module view. */
export async function resolveModuleMedia(
  businessId: string,
  module: TrainingModule,
): Promise<ModuleMedia> {
  const artifactImages = await imagesFromArtifactIds(
    businessId,
    module.sourceArtifactIds ?? [],
  );

  // --- Equipment model resolution ---
  //
  // Two paths:
  //   1. module.simId is set (stamped by curriculum on the dedicated equipment
  //      module) → show ALL assets from that sim (the full catalog).
  //   2. No simId but content mentions machine keywords → fetch the default
  //      boba-station sim and show only the machines actually mentioned.
  //
  // Either way the sim is resolved via RTRVR (with fixture fallback), so the
  // models always reflect whatever RTRVR discovered.
  let equipmentAssets: EquipmentMachineAsset[] = [];

  if (module.simId) {
    const sim = await resolveEquipmentSim(module.simId, businessId);
    equipmentAssets = sim?.assets ?? [];
  } else if (MACHINE_KEYWORDS_RE.test(module.contentMarkdown)) {
    const sim = await resolveEquipmentSim('sim_boba_station', businessId);
    equipmentAssets = filterAssetsByContent(sim?.assets ?? [], module.contentMarkdown);
  }

  const equipment = await buildModelsFromAssets(businessId, equipmentAssets);

  const seen = new Set<string>();
  const images: ModuleMediaImage[] = [];

  for (const img of [...artifactImages, ...equipment.images]) {
    if (seen.has(img.url)) continue;
    seen.add(img.url);
    images.push(img);
  }

  return {
    images: images.slice(0, 10),
    models: equipment.models,
  };
}
