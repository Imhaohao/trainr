"use client";

import * as React from "react";
import Script from "next/script";

import type { ModuleMediaModel } from "@/lib/employee/module-media";

type ModuleEquipmentShowcaseProps = {
  models: ModuleMediaModel[];
};

function hasGlb(url: string | undefined): boolean {
  if (!url) return false;
  return /\.glb(\?|$)/i.test(url) || url.startsWith("data:model/gltf");
}

export function ModuleEquipmentShowcase({ models }: ModuleEquipmentShowcaseProps) {
  const [selectedId, setSelectedId] = React.useState(models[0]?.id ?? "");
  const selected =
    models.find((m) => m.id === selectedId) ?? models[0] ?? null;

  if (!selected) return null;

  const glbReady = hasGlb(selected.glbUrl);

  // model-viewer attrs we always want
  const viewerProps: Record<string, unknown> = {
    alt: selected.name,
    "camera-controls": true,
    "auto-rotate": true,
    "shadow-intensity": "0.6",
    style: { width: "100%", height: "280px", background: "transparent" },
  };
  if (glbReady) viewerProps.src = selected.glbUrl;
  if (selected.previewUrl) viewerProps.poster = selected.previewUrl;

  return (
    <section
      aria-label="3D equipment"
      className="rounded-[var(--radius)] border border-border bg-brand-soft/40 p-4"
    >
      {/* Always load model-viewer — it shows the poster even without a GLB */}
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="lazyOnload"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          Equipment & 3D models
        </h2>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-800 dark:text-emerald-200">
          From RTRVR catalog
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ── Machine list ── */}
        <div className="flex flex-wrap gap-2">
          {models.map((model) => {
            const active = model.id === selected.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedId(model.id)}
                className={`flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition ${
                  active
                    ? "border-primary bg-card shadow-sm"
                    : "border-border bg-card/60 hover:border-primary/40"
                }`}
              >
                {model.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={model.previewUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-lg"
                    aria-hidden
                  >
                    🧋
                  </span>
                )}
                <span>
                  <span className="block font-medium leading-tight">
                    {model.name}
                  </span>
                  {model.provider ? (
                    <span className="text-xs text-muted-foreground">
                      {model.provider}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 3D viewer panel ── */}
        <div className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card">
          {React.createElement("model-viewer", viewerProps)}

          {/* fallback link inside the panel */}
          {selected.productUrl ? (
            <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
              {glbReady ? "Model loaded from storage. " : "3D model not loaded? "}
              <a
                href={selected.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-2"
              >
                {glbReady ? "View on supplier site" : "Click this link to view on supplier site"}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
