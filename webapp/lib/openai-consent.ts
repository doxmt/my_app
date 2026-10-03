import type { KeyValueStorage } from "@/lib/storage/local-store";

/** Flutter 앱(`openai_consent`)과 같은 키. 값은 `{ version, consentedAt }` JSON. */
export const OPENAI_CONSENT_KEY = "openai_consent";

/** 동의 문구가 바뀌어 다시 받아야 할 때 올린다. */
const CONSENT_VERSION = 1;

export function readOpenAiConsent(storage: KeyValueStorage | null): boolean {
  if (!storage) return false;
  try {
    const raw = storage.getItem(OPENAI_CONSENT_KEY);
    if (raw === null) return false;
    const json: unknown = JSON.parse(raw);
    return typeof json === "object" && json !== null && (json as { version?: unknown }).version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

/** 동의를 기기에 저장한다. 저장에 성공하면 true. */
export function writeOpenAiConsent(storage: KeyValueStorage | null, now: Date = new Date()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(OPENAI_CONSENT_KEY, JSON.stringify({ version: CONSENT_VERSION, consentedAt: now.toISOString() }));
    return true;
  } catch {
    return false;
  }
}
