import Link from "next/link";

import type { ChatCitation } from "@/types";

type CitationChipProps = {
  citation: ChatCitation;
};

export function CitationChip({ citation }: CitationChipProps) {
  if (!citation.moduleId) {
    return (
      <span className="inline-flex items-center rounded-full border border-indigo-400/40 bg-indigo-950/60 px-2 py-0.5 text-xs text-indigo-200">
        {citation.title}
      </span>
    );
  }

  return (
    <Link
      href={`/learn/module/${citation.moduleId}`}
      className="inline-flex max-w-full items-center rounded-full border border-indigo-400/40 bg-indigo-950/60 px-2 py-0.5 text-xs text-indigo-200 transition hover:bg-indigo-500/30"
      title={citation.snippet}
    >
      [{citation.moduleId}] {citation.title}
    </Link>
  );
}
