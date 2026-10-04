import { describe, expect, it } from "vitest";
import { OPENAI_CONSENT_KEY, readOpenAiConsent, writeOpenAiConsent } from "./openai-consent";
import type { KeyValueStorage } from "./storage/local-store";

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

const throwingStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("readOpenAiConsent", () => {
  it("저장값이 없으면 미동의다", () => {
    expect(readOpenAiConsent(fakeStorage())).toBe(false);
  });

  it("스토리지를 쓸 수 없으면 미동의다", () => {
    expect(readOpenAiConsent(null)).toBe(false);
    expect(readOpenAiConsent(throwingStorage)).toBe(false);
  });

  it("깨진 값이나 다른 버전은 미동의다", () => {
    expect(readOpenAiConsent(fakeStorage({ [OPENAI_CONSENT_KEY]: "not json" }))).toBe(false);
    expect(readOpenAiConsent(fakeStorage({ [OPENAI_CONSENT_KEY]: JSON.stringify({ version: 99 }) }))).toBe(false);
  });
});

describe("writeOpenAiConsent", () => {
  it("동의를 저장하면 다시 읽어도 동의 상태다", () => {
    const storage = fakeStorage();

    expect(writeOpenAiConsent(storage, new Date("2026-10-01T00:00:00.000Z"))).toBe(true);

    expect(readOpenAiConsent(storage)).toBe(true);
    expect(JSON.parse(storage.data[OPENAI_CONSENT_KEY])).toEqual({
      version: 1,
      consentedAt: "2026-10-01T00:00:00.000Z",
    });
  });

  it("저장에 실패하면 false를 돌려주고 예외를 던지지 않는다", () => {
    expect(writeOpenAiConsent(throwingStorage)).toBe(false);
    expect(writeOpenAiConsent(null)).toBe(false);
  });
});
