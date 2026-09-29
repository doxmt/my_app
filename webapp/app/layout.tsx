import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { UserIdProvider } from "@/components/user-id-provider";

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
  title: "DevInterview - 기술면접 준비",
  description: "개발자 기술면접 준비 앱",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${plexSansKr.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <UserIdProvider>
          <AppShell>{children}</AppShell>
        </UserIdProvider>
      </body>
    </html>
  );
}
