"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-setting";

/** 헤더용 라이트/다크 전환 버튼. */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const toDark = theme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(toDark ? "dark" : "light")}
      aria-label={toDark ? "다크 모드로 전환" : "라이트 모드로 전환"}
      title={toDark ? "다크 모드로 전환" : "라이트 모드로 전환"}
      className="grid size-9 place-items-center rounded-lg border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {toDark ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
    </button>
  );
}
