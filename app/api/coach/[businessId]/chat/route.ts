// POST /api/coach/:businessId/chat { sessionId, message } -> streamed tokens
// Phase 0 STUB — owner: T3. Streams the mock LLM response so the coach UI's
// streaming path works. T3 replaces with retrieval + Claude Sonnet + citations.

import { getLlm } from '@/lib/contracts/llm';
import { readJson } from '@/lib/http';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  await params;
  const body = await readJson<{ sessionId?: string; message?: string }>(req);
  const llm = getLlm();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      for await (const token of llm.stream({
        messages: [{ role: 'user', content: body.message ?? '' }],
      })) {
        controller.enqueue(enc.encode(token));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache',
    },
  });
}
