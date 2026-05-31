"use client";

import * as React from "react";
import Script from "next/script";

import type { ModuleMediaModel } from "@/lib/employee/module-media";

type ModuleEquipmentShowcaseProps = {
  models: ModuleMediaModel[];
};

function hasViewableGlb(url: string | undefined): boolean {
  if (!url) return false;
  return /\.glb(\?|$)/i.test(url) || url.startsWith("data:model/gltf");
}

export function ModuleEquipmentShowcase({ models }: ModuleEquipmentShowcaseProps) {
  const [selectedId, setSelectedId] = React.useState(models[0]?.id ?? "");
  const selected =
    models.find((m) => m.id === selectedId) ?? models[0] ?? null;
  const showViewer = selected && hasViewableGlb(selected.glbUrl);

  if (!selected) return null;

  return (
    <section
      aria-label="3D equipment"
      className="rounded-[var(--radius)] border border-border bg-brand-soft/40 p-4"
    >
      {showViewer ? (
        <Script
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
          type="module"
          strategy="lazyOnload"
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          Equipment & 3D models
        </h2>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-800 dark:text-emerald-200">
          From RTRVR catalog
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
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

        <div className="min-h-[220px] overflow-hidden rounded-[var(--radius)] border border-border bg-card">
          {showViewer && selected.glbUrl ? (
            React.createElement("model-viewer", {
              src: selected.glbUrl,
              alt: selected.name,
              "camera-controls": true,
              "auto-rotate": true,
              "shadow-intensity": "0.6",
              style: {
                width: "100%",
                height: "220px",
                background: "transparent",
              },
            })
          ) : selected.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.previewUrl}
              alt={selected.name}
              className="h-full min-h-[220px] w-full object-contain p-4"
            />
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
              <span className="text-3xl" aria-hidden>
                📦
              </span>
              <p>3D preview from supplier listing</p>
            </div>
          )}
        </div>
      </div>

      {selected.productUrl ? (
        <p className="mt-3 text-xs text-muted-foreground">
          <a
            href={selected.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            View source model
          </a>
          {!showViewer
            ? " — export a GLB to your storage bucket to rotate it here."
            : null}
        </p>
      ) : null}
    </section>
  );
}
