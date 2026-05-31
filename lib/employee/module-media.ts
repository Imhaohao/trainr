import { getDb } from '@/lib/contracts/db';
import { getStorage } from '@/lib/contracts/storage';
import { resolveSimForModule } from '@/lib/employee/equipment';
import type { RtrvrScrapedTab } from '@/lib/integrations/rtrvr-scrape';
import { pickPreviewImage } from '@/lib/integrations/rtrvr-scrape';
import { tigrisKeys } from '@/lib/integrations/tigris';
import type { TrainingModule } from '@/types';

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

async function modelsFromSim(
  businessId: string,
  moduleId: string,
): Promise<{ images: ModuleMediaImage[]; models: ModuleMediaModel[] }> {
  const sim = await resolveSimForModule(moduleId, businessId);
  if (!sim?.assets?.length) return { images: [], models: [] };

  const storage = getStorage();
  const images: ModuleMediaImage[] = [];
  const models: ModuleMediaModel[] = [];
  const seenImg = new Set<string>();

  for (const asset of sim.assets) {
    let glbUrl: string | undefined;
    const glbKey = tigrisKeys.equipmentModel(businessId, asset.id);
    try {
      await storage.getObject(glbKey);
      glbUrl = await storage.getSignedUrl(glbKey, 3600);
    } catch {
      glbUrl = undefined;
    }

    models.push({
      id: asset.id,
      name: asset.name,
      previewUrl: asset.previewImageUrl,
      productUrl: asset.productUrl,
      glbUrl,
      provider: asset.provider,
    });

    if (asset.previewImageUrl && !seenImg.has(asset.previewImageUrl)) {
      seenImg.add(asset.previewImageUrl);
      images.push({
        url: asset.previewImageUrl,
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
  const equipment = await modelsFromSim(businessId, module.id);

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
