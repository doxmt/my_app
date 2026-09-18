import { parseSseStream } from './sse.ts';
import type { LlmProvider, StreamChatParams } from './types.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 1024;

/** Anthropic Messages API SSE에서 `content_block_delta`의 텍스트만 순서대로 뽑는다. */
export async function* anthropicTextDeltas(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  for await (const event of parseSseStream(body)) {
    if (event.event !== 'content_block_delta') {
      continue;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(event.data);
    } catch {
      continue;
    }

    const delta = (payload as { delta?: { type?: string; text?: string } }).delta;
    if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
      yield delta.text;
    }
  }
}

export class AnthropicProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async *streamChat(params: StreamChatParams): AsyncGenerator<string> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        system: params.systemPrompt,
        max_tokens: MAX_TOKENS,
        stream: true,
        messages: params.messages,
      }),
    });

    if (!response.ok || !response.body) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Anthropic 요청 실패 (${response.status}): ${errorBody}`);
    }

    yield* anthropicTextDeltas(response.body);
  }
}
