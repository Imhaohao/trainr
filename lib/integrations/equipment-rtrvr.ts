// RTRVR-powered 3D equipment catalog for the boba practice station.
//
// Workflow (RTRVR handles discovery; you still export GLB manually):
//   1. Scrape seed pages (Daz FG Milktea Shop, CGTrader cup sealer) via RTRVR.
//   2. Extract machine names + product links; persist raw scrape + catalog to Tigris.
//   3. Enrich the fixture EquipmentSim with assets + export guide; cache per business.
//   4. UI shows machine chips + source links; drop exported GLBs into storage later.
//
// Falls back to the static fixture when RTRVR is disabled or every scrape fails.

import { getLlm } from '@/lib/contracts/llm';
import { getStorage } from '@/lib/contracts/storage';
import { BOBA_STATION_SIM } from '@/lib/employee/equipment-fixture';
import type { EquipmentSim, SimStep } from '@/types/training';
import {
  pickPreviewImage,
  rtrvrEnabled,
  rtrvrScrapeUrl,
  type RtrvrScrapedTab,
} from './rtrvr-scrape';
import { tigrisKeys } from './tigris';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SIM_ID = 'sim_boba_station';
const TEXT_SLICE = 8_000;

export type EquipmentModelProvider = 'daz3d' | 'cgtrader' | 'sketchfab' | 'other';

export type EquipmentMachineAsset = {
  id: string;
  name: string;
  category: string;
  propName?: string;
  provider: EquipmentModelProvider;
  productUrl: string;
  formats?: string[];
  previewImageUrl?: string;
  notes?: string;
};

export type EquipmentCatalog = {
  businessId: string;
  machines: EquipmentMachineAsset[];
  scrapedAt: string;
  sources: { url: string; title?: string; storageKey: string }[];
  exportGuide: string;
};

type EquipmentSeed = {
  url: string;
  provider: EquipmentModelProvider;
  title: string;
};

/** Authoritative seed pages for boba-bar 3D equipment (from product research). */
export const BOBA_3D_MODEL_SEEDS: EquipmentSeed[] = [
  {
    url: 'https://www.daz3d.com/fg-milktea-shop',
    provider: 'daz3d',
    title: 'FG Milktea Shop (Daz 3D)',
  },
  {
    url: 'https://www.cgtrader.com/3d-models/industrial/industrial-machine/vacuum-cup-press-sealing-machine-3d-cad-model',
    provider: 'cgtrader',
    title: 'Vacuum cup press sealing machine (CGTrader)',
  },
];

/** Known Daz prop names — used when scrape text is empty (RTRVR flakiness). */
const DAZ_MACHINE_FALLBACK: EquipmentMachineAsset[] = [
  {
    id: 'sealer',
    name: 'Cup sealer',
    category: 'sealer',
    propName: 'FGS Sealer Machine',
    provider: 'daz3d',
    productUrl: 'https://www.daz3d.com/fg-milktea-shop',
    formats: ['DUF', 'FBX via Daz→Blender', 'OBJ'],
    notes: 'Primary sealer prop in FG Milktea Shop pack (~$21).',
  },
  {
    id: 'shaker',
    name: 'Shaker machine',
    category: 'shaker',
    propName: 'FGS Shaker Machine',
    provider: 'daz3d',
    productUrl: 'https://www.daz3d.com/fg-milktea-shop',
    formats: ['DUF', 'FBX via Daz→Blender'],
  },
  {
    id: 'pearl_cooker',
    name: 'Pearl cooker',
    category: 'cooker',
    propName: 'FGS Pearl Cooker',
    provider: 'daz3d',
    productUrl: 'https://www.daz3d.com/fg-milktea-shop',
  },
  {
    id: 'tea_brewer',
    name: 'Tea brewer',
    category: 'brew',
    propName: 'FGS Tea Brewer',
    provider: 'daz3d',
    productUrl: 'https://www.daz3d.com/fg-milktea-shop',
  },
  {
    id: 'fructose_dispenser',
    name: 'Fructose dispenser',
    category: 'dispenser',
    propName: 'FGS Fructose Dispenser',
    provider: 'daz3d',
    productUrl: 'https://www.daz3d.com/fg-milktea-shop',
  },
  {
    id: 'sealer_cad',
    name: 'Cup sealing machine (CAD)',
    category: 'sealer',
    provider: 'cgtrader',
    productUrl:
      'https://www.cgtrader.com/3d-models/industrial/industrial-machine/vacuum-cup-press-sealing-machine-3d-cad-model',
    formats: ['STEP', 'IGES', 'FBX', 'OBJ', 'STL'],
    notes: 'Engineering-grade alternate if you need CAD formats only.',
  },
];

const STEP_MACHINE_HINT: Record<string, string> = {
  step_seal: 'sealer',
  step_tea: 'tea_brewer',
  step_syrup: 'fructose_dispenser',
};

const EXPORT_GUIDE = `## 3D asset workflow (RTRVR-discovered sources)

1. **Purchase** [FG Milktea Shop](https://www.daz3d.com/fg-milktea-shop) on Daz 3D (includes sealer, shaker, pearl cooker, tea brewer, fructose dispenser props).
2. **Export** each prop via Daz Studio → **Daz to Blender** bridge (or FBX/OBJ).
3. **Optimize** in Blender (decimate if needed) → export **GLB** with Draco compression.
4. **Upload** GLBs to Tigris under \`{businessId}/equipment/models/{machineId}.glb\` (future viewer hook).

Optional CAD-only sealer: [CGTrader cup sealing machine](https://www.cgtrader.com/3d-models/industrial/industrial-machine/vacuum-cup-press-sealing-machine-3d-cad-model).

RTRVR re-scrapes seed pages weekly to refresh product links and preview images.`;

function parseFgsProps(text: string): string[] {
  const matches = text.match(/FGS [A-Za-z0-9 ]+/g) ?? [];
  return [...new Set(matches.map((s) => s.trim()))];
}

function machineFromProp(propName: string): EquipmentMachineAsset | undefined {
  const lower = propName.toLowerCase();
  if (lower.includes('sealer')) return DAZ_MACHINE_FALLBACK.find((m) => m.id === 'sealer');
  if (lower.includes('shaker')) return DAZ_MACHINE_FALLBACK.find((m) => m.id === 'shaker');
  if (lower.includes('pearl cooker')) return DAZ_MACHINE_FALLBACK.find((m) => m.id === 'pearl_cooker');
  if (lower.includes('tea brewer')) return DAZ_MACHINE_FALLBACK.find((m) => m.id === 'tea_brewer');
  if (lower.includes('fructose')) return DAZ_MACHINE_FALLBACK.find((m) => m.id === 'fructose_dispenser');
  return undefined;
}

async function extractMachinesFromScrape(
  seed: EquipmentSeed,
  tab: RtrvrScrapedTab,
): Promise<EquipmentMachineAsset[]> {
  const preview = pickPreviewImage(tab);
  const text = tab.text ?? '';

  if (seed.provider === 'daz3d') {
    const props = parseFgsProps(text);
    const fromText = props
      .map((p) => machineFromProp(p))
      .filter((m): m is EquipmentMachineAsset => m !== undefined)
      .map((m) => ({
        ...m,
        propName: m.propName ?? props.find((p) => p.toLowerCase().includes(m.id.replace('_', ' '))),
        previewImageUrl: preview ?? m.previewImageUrl,
      }));

    if (fromText.length > 0) return fromText;
    return DAZ_MACHINE_FALLBACK.filter((m) => m.provider === 'daz3d').map((m) => ({
      ...m,
      previewImageUrl: preview ?? m.previewImageUrl,
    }));
  }

  if (seed.provider === 'cgtrader') {
    return [
      {
        ...DAZ_MACHINE_FALLBACK.find((m) => m.id === 'sealer_cad')!,
        name: tab.title?.trim() || 'Cup sealing machine (CAD)',
        previewImageUrl: preview,
        notes: text.slice(0, 200) || DAZ_MACHINE_FALLBACK.find((m) => m.id === 'sealer_cad')?.notes,
      },
    ];
  }

  return [];
}

async function mergeCatalogWithLlm(
  scrapeSummaries: { seed: EquipmentSeed; excerpt: string }[],
  baseline: EquipmentMachineAsset[],
): Promise<EquipmentMachineAsset[]> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return dedupeMachines(baseline);

  try {
    const raw = await getLlm().generate({
      system:
        'You merge scraped 3D model catalog data for boba shop equipment. ' +
        'Return ONLY valid JSON: {"machines":[{"id","name","category","propName","provider","productUrl","formats","notes"}]}. ' +
        'Keep ids stable (sealer, shaker, pearl_cooker, tea_brewer, fructose_dispenser, sealer_cad). ' +
        'provider must be daz3d|cgtrader|sketchfab|other.',
      maxTokens: 1200,
      messages: [
        {
          role: 'user',
          content: `Baseline:\n${JSON.stringify(baseline, null, 2)}\n\nScrapes:\n${scrapeSummaries
            .map((s) => `## ${s.seed.title}\n${s.excerpt}`)
            .join('\n\n')}`,
        },
      ],
    });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return dedupeMachines(baseline);
    const parsed = JSON.parse(jsonMatch[0]) as { machines?: EquipmentMachineAsset[] };
    if (!Array.isArray(parsed.machines) || parsed.machines.length === 0) {
      return dedupeMachines(baseline);
    }
    return dedupeMachines(parsed.machines);
  } catch (err) {
    console.error('[equipment-rtrvr] LLM merge failed:', err);
    return dedupeMachines(baseline);
  }
}

function dedupeMachines(machines: EquipmentMachineAsset[]): EquipmentMachineAsset[] {
  const seen = new Set<string>();
  const out: EquipmentMachineAsset[] = [];
  for (const m of machines) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}

export async function refreshEquipmentCatalog(
  businessId: string,
): Promise<EquipmentCatalog> {
  const sources: EquipmentCatalog['sources'] = [];
  let merged: EquipmentMachineAsset[] = [];
  const scrapeSummaries: { seed: EquipmentSeed; excerpt: string }[] = [];

  if (rtrvrEnabled()) {
    const results = await Promise.all(
      BOBA_3D_MODEL_SEEDS.map(async (seed) => {
        const tab = await rtrvrScrapeUrl(seed.url);
        if (!tab) return { seed, tab: null as RtrvrScrapedTab | null, machines: [] as EquipmentMachineAsset[] };
        const storageKey = tigrisKeys.equipmentScrape(businessId, seed.provider);
        try {
          await getStorage().putObject(
            storageKey,
            JSON.stringify({ seed, scrapedAt: new Date().toISOString(), tab }),
            'application/json',
          );
          sources.push({ url: seed.url, title: seed.title, storageKey });
        } catch (err) {
          console.error('[equipment-rtrvr] storage put failed:', err);
        }
        const machines = await extractMachinesFromScrape(seed, tab);
        scrapeSummaries.push({
          seed,
          excerpt: (tab.text ?? tab.title ?? '').slice(0, TEXT_SLICE),
        });
        return { seed, tab, machines };
      }),
    );
    merged = results.flatMap((r) => r.machines);
  }

  if (merged.length === 0) merged = [...DAZ_MACHINE_FALLBACK];

  merged = await mergeCatalogWithLlm(scrapeSummaries, merged);

  const catalog: EquipmentCatalog = {
    businessId,
    machines: merged,
    scrapedAt: new Date().toISOString(),
    sources,
    exportGuide: EXPORT_GUIDE,
  };

  try {
    await getStorage().putObject(
      tigrisKeys.equipmentCatalog(businessId),
      JSON.stringify(catalog),
      'application/json',
    );
  } catch (err) {
    console.error('[equipment-rtrvr] catalog cache write failed:', err);
  }

  return catalog;
}

async function loadCatalog(businessId: string): Promise<EquipmentCatalog | null> {
  try {
    const buf = await getStorage().getObject(tigrisKeys.equipmentCatalog(businessId));
    const catalog = JSON.parse(buf.toString()) as EquipmentCatalog;
    if (catalog.businessId !== businessId) return null;
    const age = Date.now() - new Date(catalog.scrapedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return catalog;
  } catch {
    return null;
  }
}

function enrichSteps(steps: SimStep[], catalog: EquipmentCatalog): SimStep[] {
  const byId = new Map(catalog.machines.map((m) => [m.id, m]));
  return steps.map((step) => {
    const machineId = STEP_MACHINE_HINT[step.id];
    const machine = machineId ? byId.get(machineId) : undefined;
    if (!machine) return step;
    const machineNote = `Station: ${machine.name}${machine.propName ? ` (${machine.propName})` : ''}`;
    return {
      ...step,
      hint: step.hint ? `${step.hint} · ${machineNote}` : machineNote,
    };
  });
}

export function buildSimFromCatalog(
  businessId: string,
  catalog: EquipmentCatalog,
): EquipmentSim {
  const base = BOBA_STATION_SIM;
  return {
    ...base,
    businessId,
    description:
      'Walk through a standard drink build at the bar — equipment names sourced via RTRVR from Daz 3D / CGTrader listings.',
    descriptionVariants: base.descriptionVariants,
    steps: enrichSteps(base.steps, catalog),
    assets: catalog.machines,
    exportGuide: catalog.exportGuide,
    source: {
      kind: 'rtrvr',
      ref: tigrisKeys.equipmentCatalog(businessId),
      retrievedAt: catalog.scrapedAt,
    },
  };
}

type CachedSim = { sim: EquipmentSim; cachedAt: string };

async function loadCachedSim(businessId: string, simId: string): Promise<EquipmentSim | null> {
  try {
    const buf = await getStorage().getObject(tigrisKeys.equipmentSim(businessId, simId));
    const cached = JSON.parse(buf.toString()) as CachedSim;
    const age = Date.now() - new Date(cached.cachedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return cached.sim;
  } catch {
    return null;
  }
}

async function cacheSim(businessId: string, simId: string, sim: EquipmentSim): Promise<void> {
  try {
    const payload: CachedSim = { sim, cachedAt: new Date().toISOString() };
    await getStorage().putObject(
      tigrisKeys.equipmentSim(businessId, simId),
      JSON.stringify(payload),
      'application/json',
    );
  } catch (err) {
    console.error('[equipment-rtrvr] sim cache write failed:', err);
  }
}

/** Resolve sim: cached RTRVR sim → refresh catalog → fixture fallback. */
export async function resolveEquipmentSim(
  simId: string,
  businessId: string,
  opts?: { forceRefresh?: boolean },
): Promise<EquipmentSim | undefined> {
  if (simId !== BOBA_STATION_SIM.id) return undefined;

  if (!rtrvrEnabled()) {
    return { ...BOBA_STATION_SIM, businessId };
  }

  if (!opts?.forceRefresh) {
    const cached = await loadCachedSim(businessId, simId);
    if (cached) return cached;
  }

  try {
    let catalog = opts?.forceRefresh ? null : await loadCatalog(businessId);
    if (!catalog) catalog = await refreshEquipmentCatalog(businessId);
    const sim = buildSimFromCatalog(businessId, catalog);
    if (sim.id !== simId) return { ...BOBA_STATION_SIM, businessId };
    await cacheSim(businessId, simId, sim);
    return sim;
  } catch (err) {
    console.error('[equipment-rtrvr] resolve failed:', err);
    return { ...BOBA_STATION_SIM, businessId };
  }
}

export async function resolveSimForModule(
  moduleId: string,
  businessId: string,
  opts?: { forceRefresh?: boolean },
): Promise<EquipmentSim | undefined> {
  if (moduleId !== BOBA_STATION_SIM.moduleId) return undefined;
  return resolveEquipmentSim(BOBA_STATION_SIM.id, businessId, opts);
}
