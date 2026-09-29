"use client";

import Image from "next/image";
import { useState } from "react";
import { PageTitle } from "@/components/page-state";
import { getBrowserClient } from "@/lib/supabase/client";

type Provider = "google" | "apple" | "kakao" | "github";

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

const BUTTON_BASE =
  "flex h-11 w-full items-center gap-2.5 px-4 text-sm font-medium disabled:opacity-50";

/** 로그인 화면. 로그인은 `/me/login`에만 둔다. */
export function LoginView({ next, failed }: { next: string; failed: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(failed ? "로그인에 실패했습니다. 다시 시도해주세요." : null);

  async function signIn(provider: Provider, failureMessage: string) {
    setLoading(true);
    setError(null);
    const { error: signInError } = await getBrowserClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        // account_email은 Biz App 전용이라 이메일 없이 가입한다(ADR-018). 이메일 scope를 빼려면 scopes를 명시해야 한다.
        ...(provider === "kakao" ? { scopes: "profile_nickname profile_image" } : {}),
      },
    });
    if (signInError) {
      setError(failureMessage);
      setLoading(false);
    }
    // 성공하면 제공자 화면으로 이동한다.
  }

  return (
    <div className="mx-auto max-w-sm">
      <PageTitle>로그인</PageTitle>
      <p className="mb-6 text-center text-sm">
        소셜 계정으로 로그인하면
        <br />
        기기에 저장된 오답노트와 이력서가 계정으로 이동합니다.
      </p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => signIn("google", "Google 로그인에 실패했습니다. 다시 시도해주세요.")}
          className={`${BUTTON_BASE} rounded border border-[#747775] bg-white text-[#1F1F1F]`}
        >
          <Image src="/login/google_g.png" alt="" width={20} height={20} />
          <span className="flex-1 text-center">Google 계정으로 로그인</span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => signIn("apple", "Apple 로그인에 실패했습니다. 다시 시도해주세요.")}
          className={`${BUTTON_BASE} rounded-lg bg-black text-white`}
        >
          <AppleLogo className="h-[18px] w-[18px]" />
          <span className="flex-1 text-center">Apple로 로그인</span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => signIn("kakao", "카카오 로그인에 실패했습니다. 다시 시도해주세요.")}
          className={`${BUTTON_BASE} rounded-xl bg-[#FEE500] text-black/85`}
        >
          <Image src="/login/kakao_symbol.png" alt="" width={19} height={18} />
          <span className="flex-1 text-center">카카오 로그인</span>
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => signIn("github", "GitHub 로그인에 실패했습니다. 다시 시도해주세요.")}
          className={`${BUTTON_BASE} rounded-lg bg-[#24292F] text-white`}
        >
          <Image src="/login/github_invertocat_white.png" alt="" width={20} height={20} />
          <span className="flex-1 text-center">GitHub로 로그인</span>
        </button>
      </div>
      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
