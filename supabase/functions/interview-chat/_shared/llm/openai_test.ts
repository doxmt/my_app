import { assertEquals } from 'jsr:@std/assert@1';
import { openAiTextDeltas } from './openai.ts';

function streamFromString(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

const FIXTURE = [
  'data: {"choices":[{"delta":{"role":"assistant"}}]}',
  '',
  'data: {"choices":[{"delta":{"content":"안녕"}}]}',
  '',
  'data: {"choices":[{"delta":{"content":"하세요"}}]}',
  '',
  'data: {"choices":[{"delta":{}}]}',
  '',
  'data: [DONE]',
  '',
].join('\n');

Deno.test('openAiTextDeltas는 choices[].delta.content만 순서대로 뽑는다', async () => {
  const chunks: string[] = [];
  for await (const chunk of openAiTextDeltas(streamFromString(FIXTURE))) {
    chunks.push(chunk);
  }
  assertEquals(chunks, ['안녕', '하세요']);
});

Deno.test('openAiTextDeltas는 [DONE] 이후 이벤트를 무시한다', async () => {
  const withTrailingEvent =
    FIXTURE + 'data: {"choices":[{"delta":{"content":"무시됨"}}]}\n\n';
  const chunks: string[] = [];
  for await (const chunk of openAiTextDeltas(streamFromString(withTrailingEvent))) {
    chunks.push(chunk);
  }
  assertEquals(chunks, ['안녕', '하세요']);
});
