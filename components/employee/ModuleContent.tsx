"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ModuleEquipmentShowcase } from "@/components/employee/ModuleEquipmentShowcase";
import { ModuleMediaGallery } from "@/components/employee/ModuleMediaGallery";
import type { ModuleMedia } from "@/lib/employee/module-media";

type ModuleContentProps = {
  markdown: string;
  media: ModuleMedia | null;
  exportGuideMarkdown?: string;
};

/** Drop duplicate top-level heading — page title already shows module name. */
function stripLeadingH1(md: string): string {
  return md.replace(/^\s*#\s+[^\n]+\n+/, "").trim();
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="module-md-h1">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="module-md-h2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="module-md-h3">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="module-md-p">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="module-md-ul">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="module-md-ol">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="module-md-li">{children}</li>
  ),
  hr: () => <hr className="module-md-hr" />,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-muted-foreground">{children}</em>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="module-md-blockquote">{children}</blockquote>
  ),
};

export function ModuleContent({
  markdown,
  media,
  exportGuideMarkdown,
}: ModuleContentProps) {
  const body = stripLeadingH1(markdown.trim());

  return (
    <div className="space-y-8">
      {media && media.images.length > 0 ? (
        <ModuleMediaGallery images={media.images} />
      ) : null}

      {media && media.models.length > 0 ? (
        <ModuleEquipmentShowcase models={media.models} />
      ) : null}

      {body ? (
        <article className="module-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {body}
          </ReactMarkdown>
        </article>
      ) : null}

      {exportGuideMarkdown?.trim() ? (
        <details className="rounded-[var(--radius)] border border-border bg-muted/30 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            3D equipment workflow
          </summary>
          <article className="module-markdown mt-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {exportGuideMarkdown.trim()}
            </ReactMarkdown>
          </article>
        </details>
      ) : null}
    </div>
  );
}
