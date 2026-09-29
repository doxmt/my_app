import { describe, expect, it } from "vitest";
import { createSseParser, readSseStream, type SseEvent } from "./sse";

function streamOf(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<SseEvent[]> {
  const events: SseEvent[] = [];
  for await (const event of readSseStream(stream)) events.push(event);
  return events;
}

describe("SSE 파서", () => {
  it("(a) 이벤트가 두 청크에 걸쳐 잘려도 파싱한다", () => {
    const parser = createSseParser();
    expect(parser.push('event: delta\ndata: {"te')).toEqual([]);
    expect(parser.push('xt":"안녕"}\n\n')).toEqual([{ event: "delta", data: '{"text":"안녕"}' }]);
  });

  it("(a') 구분자 \\n\\n 자체가 청크 경계에서 잘려도 파싱한다", () => {
    const parser = createSseParser();
    expect(parser.push('event: done\ndata: {}\n')).toEqual([]);
    expect(parser.push("\n")).toEqual([{ event: "done", data: "{}" }]);
  });

  it("(b) 한 청크에 이벤트가 여러 개여도 모두 파싱한다", () => {
    const parser = createSseParser();
    const events = parser.push(
      'event: usage\ndata: {"tier":"free","remaining":3}\n\nevent: delta\ndata: {"text":"a"}\n\nevent: done\ndata: {}\n\n',
    );
    expect(events.map((event) => event.event)).toEqual(["usage", "delta", "done"]);
    expect(events[0].data).toBe('{"tier":"free","remaining":3}');
  });

  it("\\r\\n 줄바꿈을 \\n으로 취급하고, event나 data가 없는 블록은 버린다", () => {
    const parser = createSseParser();
    expect(parser.push('event: delta\r\ndata: {"text":"x"}\r\n\r\n: comment\n\n')).toEqual([
      { event: "delta", data: '{"text":"x"}' },
    ]);
  });

  it("(c) 멀티바이트 한글이 바이트 청크 경계에서 잘려도 깨지지 않는다", async () => {
    const bytes = new TextEncoder().encode('event: delta\ndata: {"text":"면접 시작"}\n\n');
    // '면'(3바이트) 중간에서 자른다.
    const cut = bytes.indexOf(0xeb) + 1;
    const events = await collect(streamOf([bytes.slice(0, cut), bytes.slice(cut)]));
    expect(events).toEqual([{ event: "delta", data: '{"text":"면접 시작"}' }]);
  });

  it("한 바이트씩 도착해도 파싱한다", async () => {
    const bytes = new TextEncoder().encode('event: delta\ndata: {"text":"가나"}\n\nevent: done\ndata: {}\n\n');
    const events = await collect(streamOf(Array.from(bytes, (byte) => new Uint8Array([byte]))));
    expect(events.map((event) => event.event)).toEqual(["delta", "done"]);
    expect(events[0].data).toBe('{"text":"가나"}');
  });
});
