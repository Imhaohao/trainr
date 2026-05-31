"use client";

import * as React from "react";

import type { ModuleMediaImage } from "@/lib/employee/module-media";

type ModuleMediaGalleryProps = {
  images: ModuleMediaImage[];
};

export function ModuleMediaGallery({ images }: ModuleMediaGalleryProps) {
  const [active, setActive] = React.useState(0);
  const safeIndex = Math.min(active, Math.max(0, images.length - 1));
  const hero = images[safeIndex];

  if (!hero) return null;

  return (
    <section aria-label="Module photos" className="space-y-3">
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-muted/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.url}
          alt={hero.alt}
          className="aspect-[16/9] w-full object-cover"
          loading="eager"
        />
        {hero.credit ? (
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            Source: {hero.credit}
          </p>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 overflow-hidden rounded-md border-2 transition ${
                i === safeIndex
                  ? "border-brand ring-2 ring-brand/25"
                  : "border-border opacity-80 hover:opacity-100"
              }`}
              aria-label={`Show image ${i + 1}: ${img.alt}`}
              aria-pressed={i === safeIndex}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="h-16 w-24 object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
