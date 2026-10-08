"use client";

import { ChevronDown, LogIn, LogOut, Menu, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { useAccount } from "@/components/use-account";
import { getBrowserClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

const NAV: NavItem[] = [
  {
    href: "/",
    label: "문제풀이",
    isActive: (p) => p === "/" || p.startsWith("/categories"),
  },
  {
    href: "/interview",
    label: "모의면접",
    isActive: (p) => p.startsWith("/interview"),
  },
  {
    href: "/me/wrong-notes",
    label: "오답노트",
    isActive: (p) => p.startsWith("/me/wrong-notes"),
  },
  {
    href: "/me/resume",
    label: "이력서",
    isActive: (p) => p.startsWith("/me/resume"),
  },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md" aria-label="DevInterview 홈">
      <Image src="/icon.png" width={32} height={32} alt="" aria-hidden className="size-8 rounded-md" priority />
      <span className="text-[17px] font-semibold tracking-tight">DevInterview</span>
    </Link>
  );
}

/** 우측 계정 영역. 비회원이면 로그인 버튼, 회원이면 계정 드롭다운. */
function AccountArea({ onNavigate }: { onNavigate?: () => void }) {
  const { userId, ready, displayName } = useAccount();
  const [open, setOpen] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready) return <div className="h-9 w-20" aria-hidden />;

  if (!userId) {
    return (
      <Link href="/me/login" onClick={onNavigate} className={buttonVariants({ size: "lg" })}>
        <LogIn aria-hidden />
        로그인
      </Link>
    );
  }

  async function signOut() {
    if (!window.confirm("로그아웃 하시겠어요?")) return;
    setSignOutError(false);
    const { error } = await getBrowserClient().auth.signOut();
    if (error) setSignOutError(true);
    else setOpen(false);
  }

  const name = displayName ?? "회원";
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-2 rounded-lg border bg-card pr-2 pl-1.5 text-sm font-medium hover:bg-muted"
      >
        <span
          aria-hidden
          className="grid size-6 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-28 truncate">{name}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="계정 메뉴"
          className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{name}</p>
          </div>
          <div className="my-1 border-t" />
          <Link
            role="menuitem"
            href="/me"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
          >
            <User className="size-4" aria-hidden />내 정보
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          >
            <LogOut className="size-4" aria-hidden />
            로그아웃
          </button>
          {signOutError && (
            <p role="alert" className="px-3 py-2 text-xs text-destructive">
              로그아웃에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="주요 메뉴" className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.isActive(pathname) ? "page" : undefined}
              className="relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:-bottom-[13px] aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <AccountArea />
        </div>
        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="grid size-10 place-items-center rounded-md border"
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t bg-background lg:hidden">
          <nav aria-label="주요 메뉴 (모바일)" className="mx-auto flex max-w-[1200px] flex-col gap-1 p-3 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={item.isActive(pathname) ? "page" : undefined}
                className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t pt-3">
              <div className="px-1">
                <AccountArea onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/**
 * 사이트 셸: sticky 상단 내비 + 본문 + 푸터.
 * 본문 컨테이너(최대 1200px)는 각 화면이 `Page`로 감싼다(홈 히어로·모의면접은 전체 폭을 쓴다).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-40 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        본문으로 건너뛰기
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
