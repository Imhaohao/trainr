// POST /api/coach/:businessId/chat — SSE coach with citations + persistence

import { nanoid } from "nanoid";
import { getDb } from "@/lib/contracts/db";
import { coachReply } from "@/lib/coach/coach-reply";
import { encodeSse, streamCoachTokens } from "@/lib/coach/respond";
import { getRecentMiss } from "@/lib/employee/progress-utils";
import {
  asModuleProgress,
  findModule,
  missedQuestionPrompt,
} from "@/types/training";
import { readJson } from "@/lib/http";

interface CoachBody {
  sessionId?: string;
  message?: string;
  employeeId?: string;
  language?: string;
  moduleId?: string;
  intent?: string;
  focus?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const { businessId } = await params;
  const body = await readJson<CoachBody>(req);
  const message = (body.message ?? "").trim();
  if (!message) {
    return new Response(JSON.stringify({ ok: false, error: "message required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const db = getDb();
  const sessionId = body.sessionId ?? `sess_${nanoid(12)}`;
  const language = body.language ?? "en";

  const programs = await db.programs.list({ businessId });
  const program = programs.sort((a, b) => b.version - a.version)[0];
  const modules = program?.modules ?? [];

  const history = await db.chat.list({ sessionId });

  let missedConcept: string | undefined;
  if (body.employeeId && body.focus === "missed" && body.moduleId) {
    const rows = (await db.progress.list({ employeeId: body.employeeId })).map(
      asModuleProgress,
    );
    const miss = getRecentMiss(rows);
    const mod = findModule(modules, body.moduleId);
    if (miss && mod) {
      missedConcept = missedQuestionPrompt(mod, miss.questionId);
    }
  }

  await db.chat.create({
    id: `chat_${nanoid(10)}`,
    sessionId,
    role: "user",
    content: message,
    createdAt: new Date().toISOString(),
  });

  const result = await coachReply({
    businessId,
    message,
    language,
    history,
    moduleId: body.moduleId,
    intent: body.intent,
    focus: body.focus,
    missedConcept,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const token of streamCoachTokens(result.text)) {
          controller.enqueue(enc.encode(encodeSse({ type: "token", text: token })));
        }
        await db.chat.create({
          id: `chat_${nanoid(10)}`,
          sessionId,
          role: "assistant",
          content: result.text,
          citations: result.citations,
          createdAt: new Date().toISOString(),
        });
        controller.enqueue(
          enc.encode(
            encodeSse({
              type: "done",
              citations: result.citations,
              sessionId,
            }),
          ),
        );
      } catch (err) {
        controller.enqueue(
          enc.encode(
            encodeSse({
              type: "token",
              text: "Sorry — something went wrong. Try again.",
            }),
          ),
        );
        controller.enqueue(
          enc.encode(
            encodeSse({
              type: "done",
              citations: [],
              sessionId,
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
