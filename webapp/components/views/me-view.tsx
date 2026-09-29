"use client";

import { ChevronRight, CircleUserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageTitle } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { useUserId } from "@/components/user-id-provider";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

function MenuLink({ href, title, subtitle }: { href: string; title: string; subtitle?: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
      <span>
        <span className="block text-sm font-medium">{title}</span>
        {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  );
}

/** 내 정보 탭. 로그인 진입점(또는 계정 정보)과 이력서·오답노트 메뉴. */
export function MeView() {
  const { userId } = useUserId();
  const [signOutError, setSignOutError] = useState(false);

  const { data: user } = useAsync(userId ? `me:${userId}` : null, async () => {
    const { data } = await getBrowserClient().auth.getUser();
    return data.user;
  });

  const displayName = user
    ? String(
        user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.user_metadata?.nickname ??
          user.email ??
          "회원",
      )
    : null;

  async function signOut() {
    setSignOutError(false);
    const { error } = await getBrowserClient().auth.signOut();
    if (error) setSignOutError(true);
  }

  return (
    <>
      <PageTitle>내 정보</PageTitle>
      <div className="divide-y rounded-lg border">
        {userId ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <CircleUserRound className="size-8 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName ?? "회원"}</p>
              {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
            <Button variant="ghost" onClick={signOut}>
              로그아웃
            </Button>
          </div>
        ) : (
          <MenuLink href="/me/login" title="로그인" subtitle="소셜 계정으로 로그인하고 데이터를 백업하세요" />
        )}
        <MenuLink href="/me/resume" title="이력서" />
        <MenuLink href="/me/wrong-notes" title="오답노트" />
      </div>
      {signOutError && <p className="mt-3 text-sm text-destructive">로그아웃에 실패했습니다. 다시 시도해주세요.</p>}
    </>
  );
}
