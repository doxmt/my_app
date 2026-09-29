export type SseEvent = { event: string; data: string };

/** 청크 문자열을 받아 완성된 SSE 이벤트를 돌려준다. 이벤트 경계는 빈 줄(`\n\n`). */
export function createSseParser() {
  let buffer = "";

  return {
    push(text: string): SseEvent[] {
      buffer += text.replaceAll("\r\n", "\n");
      const events: SseEvent[] = [];

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const parsed = parseEvent(rawEvent);
        if (parsed) events.push(parsed);
        separatorIndex = buffer.indexOf("\n\n");
      }
      return events;
    },
  };
}

function parseEvent(rawEvent: string): SseEvent | null {
  let event: string | null = null;
  const dataLines: string[] = [];
  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }
  if (event === null || dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

/**
 * `response.body`를 `getReader()` 루프로 읽어 SSE 이벤트를 하나씩 내보낸다.
 * (Safari 호환성을 위해 ReadableStream async iteration은 쓰지 않는다.)
 * `stream: true` 디코더가 청크 경계에서 잘린 멀티바이트 문자를 이어 붙인다.
 */
export async function* readSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  const parser = createSseParser();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const event of parser.push(decoder.decode(value, { stream: true }))) {
        yield event;
      }
    }
    for (const event of parser.push(decoder.decode())) {
      yield event;
    }
  } finally {
    reader.releaseLock();
  }
}
