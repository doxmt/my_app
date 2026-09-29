import { AlertCircle, ChevronRight, Inbox } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** 본문 컨테이너. 가운데 정렬, 최대 폭 1200px. */
export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10 ${className}`}>{children}</div>
  );
}

/** 콘텐츠 자리를 잡는 스켈레톤. 스크린리더에는 "불러오는 중"만 읽힌다. */
export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">불러오는 중...</span>
      <div aria-hidden className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card p-5">
            <div className="mb-3 size-8 rounded-md bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed bg-card py-14 text-center"
    >
      <AlertCircle className="size-6 text-destructive" aria-hidden />
      <p className="text-sm">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed bg-card py-14 text-center">
      <Inbox className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export type Crumb = { href?: string; label: string };

/** 경로 표시. 마지막 항목이 현재 페이지다. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="경로" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="size-3.5 opacity-60" aria-hidden />}
              {item.href && !last ? (
                <Link href={item.href} className="rounded hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-foreground" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** 페이지 머리말: breadcrumb + h1 + 설명 + 우측 액션. */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 border-b pb-6 lg:mb-8">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}

/** 요약 통계 줄. 클라이언트가 이미 가진 값만 표시한다. */
export function StatBar({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="mb-6 flex flex-wrap divide-x rounded-xl border bg-card">
      {items.map((item) => (
        <div key={item.label} className="min-w-[110px] flex-1 px-5 py-3">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
