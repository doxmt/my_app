"use client";

import { FileText, NotebookPen, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Page, PageHeader } from "@/components/page-state";

const ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}[] = [
  { href: "/me", label: "내 정보", icon: UserRound, exact: true },
  { href: "/me/resume", label: "이력서", icon: FileText },
  { href: "/me/wrong-notes", label: "오답노트", icon: NotebookPen },
];

/** 내 정보 영역 공통 틀: 페이지 머리말 + 서브 내비(넓은 화면은 좌측, 좁으면 상단 탭) + 본문. */
export function MeLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const breadcrumb = [
    { href: "/", label: "홈" },
    ...(title === "내 정보" ? [] : [{ href: "/me", label: "내 정보" }]),
    { label: title },
  ];

  return (
    <Page>
      <PageHeader title={title} description={description} breadcrumb={breadcrumb} actions={actions} />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="내 정보 메뉴">
          <ul className="flex gap-1 overflow-x-auto border-b lg:sticky lg:top-24 lg:flex-col lg:border-b-0">
            {ITEMS.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <section aria-label={title} className="min-w-0">
          {children}
        </section>
      </div>
    </Page>
  );
}
