"use client";

import { useEffect } from "react";
import { applyTheme } from "@/lib/theme-client";

/** 다른 탭에서 바꾼 화면 모드를 반영한다. 화면에는 아무것도 그리지 않는다. */
export function ThemeSync() {
  useEffect(() => {
    window.addEventListener("storage", applyTheme);
    return () => window.removeEventListener("storage", applyTheme);
  }, []);
  return null;
}
