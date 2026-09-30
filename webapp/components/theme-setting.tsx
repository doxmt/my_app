"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_THEME, THEME_CHANGE_EVENT, type ThemePreference } from "@/lib/theme";
import { readTheme, writeTheme } from "@/lib/theme-client";

/** 현재 화면 모드와 변경 함수. 저장값이 바뀌면(헤더 토글, 다른 탭 등) 함께 갱신된다. */
export function useTheme(): [ThemePreference, (theme: ThemePreference) => void] {
  const [theme, setTheme] = useState<ThemePreference>(DEFAULT_THEME);

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    sync();
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return [theme, writeTheme];
}

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
];

/** 내 정보의 화면 모드 설정. 기본은 라이트다. */
export function ThemeSetting() {
  const [theme, setTheme] = useTheme();

  return (
    <div>
      <div role="group" aria-label="화면 모드" className="inline-flex rounded-lg border bg-muted p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={theme === value}
            onClick={() => setTheme(value)}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">기본은 라이트 모드입니다. 이 브라우저에 저장됩니다.</p>
    </div>
  );
}
