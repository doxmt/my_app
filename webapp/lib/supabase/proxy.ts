import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 세션 쿠키를 갱신한다. 인가 판단은 하지 않는다(보호가 필요한 서버 코드는 각자 검사한다). */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // 세션 토큰이 담긴 응답이 CDN에 캐시되지 않도록 라이브러리가 넘겨준 헤더를 그대로 붙인다.
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}
