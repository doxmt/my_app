"use client";

import { ChevronRight, FileText, LogIn, NotebookPen, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MeLayout } from "@/components/me-layout";
import { ThemeSetting } from "@/components/theme-setting";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAccount } from "@/components/use-account";
import { getBrowserClient } from "@/lib/supabase/client";

function MenuLink({
  href,
  title,
  subtitle,
  icon: Icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="interactive-surface group flex items-center gap-4 rounded-xl border bg-card p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" aria-hidden />
    </Link>
  );
}

/** 내 정보. 계정 상태와 이력서·오답노트 바로가기. */
export function MeView() {
  const { userId, displayName } = useAccount();
  const router = useRouter();
  const [signOutError, setSignOutError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  async function signOut() {
    if (!window.confirm("로그아웃 하시겠어요?")) return;
    setSignOutError(false);
    const { error } = await getBrowserClient().auth.signOut();
    if (error) setSignOutError(true);
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "회원탈퇴 하시겠어요? 계정과 계정에 저장된 오답노트·이력서·면접 기록이 바로 삭제되며 되돌릴 수 없습니다.",
    );
    if (!confirmed) return;
    setDeleteError(false);
    setDeleting(true);
    const supabase = getBrowserClient();
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) {
      setDeleteError(true);
      setDeleting(false);
      return;
    }
    // 서버 계정은 이미 없으므로 브라우저에 남은 세션만 지운다.
    await supabase.auth.signOut({ scope: "local" });
    router.push("/");
  }

  return (
    <MeLayout title="내 정보" description="계정과 학습 데이터를 관리합니다.">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="account-title" className="rounded-xl border bg-card p-6">
          <h2 id="account-title" className="mb-4 text-sm font-semibold text-muted-foreground">
            계정
          </h2>
          {userId ? (
            <div className="flex flex-wrap items-center gap-4">
              <span
                aria-hidden
                className="grid size-14 place-items-center rounded-full bg-accent text-xl font-semibold text-accent-foreground"
              >
                {(displayName ?? "회").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{displayName ?? "회원"}</p>
                <p className="mt-1 text-xs text-muted-foreground">오답노트와 이력서가 계정에 저장됩니다.</p>
              </div>
              <Button variant="outline" onClick={signOut}>
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">비회원으로 이용 중</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  오답노트와 이력서가 이 기기에만 저장됩니다. 소셜 계정으로 로그인하면 계정으로 이동합니다.
                </p>
              </div>
              <Link href="/me/login" className={buttonVariants({ size: "lg" })}>
                <LogIn aria-hidden />
                로그인
              </Link>
            </div>
          )}
          {signOutError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              로그아웃에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
          {userId && (
            <div className="mt-4 border-t pt-4">
              <Button variant="ghost" size="sm" className="text-destructive" onClick={deleteAccount} disabled={deleting}>
                {deleting ? "탈퇴 중…" : "회원탈퇴"}
              </Button>
              {deleteError && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  회원탈퇴에 실패했습니다. 다시 시도해주세요.
                </p>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="theme-title" className="rounded-xl border bg-card p-6">
          <h2 id="theme-title" className="mb-4 text-sm font-semibold text-muted-foreground">
            화면 모드
          </h2>
          <ThemeSetting />
        </section>

        <section aria-labelledby="shortcut-title">
          <h2 id="shortcut-title" className="mb-3 text-sm font-semibold text-muted-foreground">
            바로가기
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <MenuLink
              href="/me/resume"
              icon={FileText}
              title="이력서"
              subtitle="모의면접에 사용할 이력서를 입력합니다"
            />
            <MenuLink
              href="/me/wrong-notes"
              icon={NotebookPen}
              title="오답노트"
              subtitle="틀린 문제를 모아 다시 복습합니다"
            />
          </div>
        </section>
      </div>
    </MeLayout>
  );
}
