import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

let browserClient: ReturnType<typeof createClient> | null = null;

/** 이벤트 핸들러·effect 안에서만 호출한다(렌더 중 호출하면 빌드 시 prerender에서 env가 없어 실패한다). */
export function getBrowserClient() {
  browserClient ??= createClient();
  return browserClient;
}
