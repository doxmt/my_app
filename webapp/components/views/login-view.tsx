"use client";

import Image from "next/image";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

type Provider = "kakao" | "google" | "github";

const BUTTON_BASE = "flex h-11 w-full items-center gap-2.5 px-4 text-sm font-medium disabled:opacity-50";

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
        // 카카오는 Supabase가 항상 account_email·profile_image·profile_nickname을 요청한다(ADR-022).
      },
    });
    if (signInError) {
      setError(failureMessage);
      setLoading(false);
    }
    // 성공하면 제공자 화면으로 이동한다.
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:py-20">
      <div className="mx-auto w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight">로그인</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          소셜 계정으로 로그인하면
          <br />
          기기에 저장된 오답노트와 이력서가 계정으로 이동합니다.
        </p>
        <div className="flex flex-col gap-3">
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
            onClick={() => signIn("google", "Google 로그인에 실패했습니다. 다시 시도해주세요.")}
            className={`${BUTTON_BASE} rounded border border-[#747775] bg-white text-[#1F1F1F]`}
          >
            <Image src="/login/google_g.png" alt="" width={20} height={20} />
            <span className="flex-1 text-center">Google 계정으로 로그인</span>
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
        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
