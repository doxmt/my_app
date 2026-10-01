import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeSync } from "@/components/theme-sync";
import { UserIdProvider } from "@/components/user-id-provider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

// 한글 본문용 IBM Plex Sans KR + 코드·수치 표기용 JetBrains Mono.
const plexSansKr = IBM_Plex_Sans_KR({
  variable: "--font-plex",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "DevInterview",
  title: {
    default: "DevInterview | 개발자 기술면접 준비",
    template: "%s | DevInterview",
  },
  description: "서술형 문제풀이와 이력서 기반 AI 모의면접으로 개발자 기술면접을 준비하세요.",
  keywords: ["개발자 면접", "기술면접", "코딩 인터뷰", "AI 모의면접", "DevInterview"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "128x128" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "DevInterview | 개발자 기술면접 준비",
    description: "서술형 문제풀이와 이력서 기반 AI 모의면접으로 개발자 기술면접을 준비하세요.",
    siteName: "DevInterview",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "DevInterview | 개발자 기술면접 준비",
    description: "서술형 문제풀이와 이력서 기반 AI 모의면접으로 개발자 기술면접을 준비하세요.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${plexSansKr.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <ThemeSync />
        <UserIdProvider>
          <AppShell>{children}</AppShell>
        </UserIdProvider>
      </body>
    </html>
  );
}
