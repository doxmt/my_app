/** 벤더별 SSE 텍스트를 파싱하기 전, 공통 `event`/`data` 단위로 쪼개는 파서. */
export interface RawSseEvent {
  event: string | null;
  data: string;
}

export async function* parseSseStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<RawSseEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      let separatorIndex: number;
      while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const event = parseRawEvent(rawEvent);
        if (event) {
          yield event;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseRawEvent(raw: string): RawSseEvent | null {
  let event: string | null = null;
  const dataLines: string[] = [];

  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }
  return { event, data: dataLines.join('\n') };
}
