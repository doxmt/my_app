import { assertEquals } from 'jsr:@std/assert@1';
import { anthropicTextDeltas } from './anthropic.ts';

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
  'event: message_start',
  'data: {"type":"message_start","message":{"id":"msg_1"}}',
  '',
  'event: content_block_start',
  'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
  '',
  'event: content_block_delta',
  'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"안녕"}}',
  '',
  'event: content_block_delta',
  'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"하세요"}}',
  '',
  'event: content_block_stop',
  'data: {"type":"content_block_stop","index":0}',
  '',
  'event: message_delta',
  'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}',
  '',
  'event: message_stop',
  'data: {"type":"message_stop"}',
  '',
].join('\n');

Deno.test('anthropicTextDeltas는 content_block_delta의 text만 순서대로 뽑는다', async () => {
  const chunks: string[] = [];
  for await (const chunk of anthropicTextDeltas(streamFromString(FIXTURE))) {
    chunks.push(chunk);
  }
  assertEquals(chunks, ['안녕', '하세요']);
});

Deno.test('anthropicTextDeltas는 빈 스트림에서 아무것도 내지 않는다', async () => {
  const chunks: string[] = [];
  for await (const chunk of anthropicTextDeltas(streamFromString(''))) {
    chunks.push(chunk);
  }
  assertEquals(chunks, []);
});
