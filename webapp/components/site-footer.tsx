import Link from "next/link";

const LINKS = [
  { href: "/", label: "문제풀이" },
  { href: "/interview", label: "모의면접" },
  { href: "/me/wrong-notes", label: "오답노트" },
  { href: "/me/resume", label: "이력서" },
  { href: "/me", label: "내 정보" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-sidebar">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <div className="max-w-sm">
          <p className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden
              className="grid size-6 place-items-center rounded bg-primary font-mono text-[11px] font-bold text-primary-foreground"
            >
              {">_"}
            </span>
            DevInterview
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            서술형 문제풀이와 이력서 기반 AI 모의면접으로 개발자 기술면접을 준비하는 서비스입니다.
          </p>
        </div>
        <nav aria-label="푸터 링크">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted-foreground hover:text-foreground hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} DevInterview. All rights reserved.</p>
          <ul className="flex gap-x-4">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
