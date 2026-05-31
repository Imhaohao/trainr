import type { CoachReplyResult } from "./coach-reply";

export type CoachSseEvent =
  | { type: "token"; text: string }
  | {
      type: "done";
      citations: CoachReplyResult["citations"];
      sessionId: string;
    };

export async function* streamCoachTokens(
  text: string,
  chunkSize = 12,
): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
    await new Promise((r) => setTimeout(r, 8));
  }
}

export function encodeSse(event: CoachSseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
