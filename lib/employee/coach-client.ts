import type { ChatCitation } from "@/types";

export type CoachChatRequest = {
  sessionId?: string;
  message: string;
  employeeId?: string;
  language?: string;
  moduleId?: string;
  intent?: string;
  focus?: string;
};

export type CoachDoneEvent = {
  citations: ChatCitation[];
  sessionId: string;
};

type SsePayload =
  | { type: "token"; text: string }
  | { type: "done"; citations: ChatCitation[]; sessionId: string };

export async function streamCoachChat(
  businessId: string,
  body: CoachChatRequest,
  onToken: (token: string) => void,
  onDone?: (event: CoachDoneEvent) => void,
): Promise<CoachDoneEvent> {
  const res = await fetch(`/api/coach/${businessId}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    throw new Error("Coach request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneEvent: CoachDoneEvent = { citations: [], sessionId: body.sessionId ?? "" };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const payload = JSON.parse(line.slice(6)) as SsePayload;
        if (payload.type === "token") {
          onToken(payload.text);
        } else if (payload.type === "done") {
          doneEvent = {
            citations: payload.citations ?? [],
            sessionId: payload.sessionId,
          };
          onDone?.(doneEvent);
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }

  return doneEvent;
}
