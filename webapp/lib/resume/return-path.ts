import { safeNextPath } from "@/lib/auth/safe-next";

/** 이력서 저장 후 돌아갈 내부 경로. `?next=/interview`처럼 안전한 내부 경로일 때만 돌려주고, 없거나 위험하면 null. */
export function resumeReturnPath(search: string): string | null {
  const next = new URLSearchParams(search).get("next");
  if (next === null) return null;
  const path = safeNextPath(next, "");
  return path === "" ? null : path;
}
