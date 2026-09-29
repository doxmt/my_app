/** 로그인 후 돌아갈 경로. `/`로 시작하는 내부 경로만 허용하고 나머지는 fallback으로 돌린다. */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
