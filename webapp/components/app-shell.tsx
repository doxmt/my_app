"use client";

import { MessagesSquare, House, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Tab = { href: string; label: string; icon: LucideIcon; isActive: (pathname: string) => boolean };

const TABS: Tab[] = [
  { href: "/", label: "홈", icon: House, isActive: (p) => p === "/" || p.startsWith("/categories") },
  { href: "/interview", label: "모의면접", icon: MessagesSquare, isActive: (p) => p.startsWith("/interview") },
  { href: "/me", label: "내 정보", icon: User, isActive: (p) => p.startsWith("/me") },
];

/** 하단 탭 3개(홈/모의면접/내 정보). 좁은 화면은 하단 탭, 넓은 화면(md 이상)은 좌측 내비 + 본문 폭 제한. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-56 shrink-0 border-r bg-background md:block">
        <nav aria-label="주요 메뉴" className="sticky top-0 flex flex-col gap-1 p-3">
          <p className="px-3 py-4 text-lg font-semibold">기술면접 준비</p>
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.isActive(pathname) ? "page" : undefined}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:text-primary"
            >
              <tab.icon className="size-5" aria-hidden />
              {tab.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-8 md:pb-8">{children}</main>

      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t bg-background md:hidden"
      >
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.isActive(pathname) ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground aria-[current=page]:font-semibold aria-[current=page]:text-primary"
          >
            <tab.icon className="size-5" aria-hidden />
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
