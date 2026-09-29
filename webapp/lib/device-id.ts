import { getBrowserStorage, type KeyValueStorage } from "@/lib/storage/local-store";

const DEVICE_ID_KEY = "device_id";

/**
 * 기기 ID. 최초 호출 때 UUID v4를 만들어 localStorage에 저장하고 이후에는 저장된 값을 돌려준다.
 * 서버의 한도 계산용 `X-Device-Id` 헤더에만 쓴다. 스토리지를 쓸 수 없으면 호출마다 새 값이 되지 않도록 메모리에 둔다.
 */
let memoryId: string | null = null;

export function getDeviceId(storage: KeyValueStorage | null = getBrowserStorage()): string {
  try {
    const existing = storage?.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
  } catch {
    // 아래에서 새로 만든다.
  }
  const id = memoryId ?? crypto.randomUUID();
  memoryId = id;
  try {
    storage?.setItem(DEVICE_ID_KEY, id);
  } catch {
    // 메모리 값으로 계속 쓴다.
  }
  return id;
}
