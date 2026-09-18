import { parseSseStream } from './sse.ts';
import type { LlmProvider, StreamChatParams } from './types.ts';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4.1-mini';

/** OpenAI Chat Completions SSE에서 `choices[].delta.content`만 순서대로 뽑는다. `[DONE]`에서 멈춘다. */
export async function* openAiTextDeltas(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  for await (const event of parseSseStream(body)) {
    if (event.data === '[DONE]') {
      break;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(event.data);
    } catch {
      continue;
    }

    const content = (payload as { choices?: { delta?: { content?: string } }[] }).choices?.[0]
      ?.delta?.content;
    if (typeof content === 'string') {
      yield content;
    }
  }
}

export class OpenAiProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async *streamChat(params: StreamChatParams): AsyncGenerator<string> {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [
          { role: 'system', content: params.systemPrompt },
          ...params.messages,
        ],
      }),
    });

    if (!response.ok || !response.body) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`OpenAI 요청 실패 (${response.status}): ${errorBody}`);
    }

    yield* openAiTextDeltas(response.body);
  }
}
