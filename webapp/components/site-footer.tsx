import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-sidebar">
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
    </footer>
  );
}
