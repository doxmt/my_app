import { parseThemePreference, resolveTheme, THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type ThemePreference } from "./theme";

/** 브라우저 전용. 현재 화면 모드(저장값이 없으면 기본값 라이트). */
export function readTheme(): ThemePreference {
  try {
    return resolveTheme(parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY)));
  } catch {
    return resolveTheme(null);
  }
}

/** 현재 화면 모드에 맞게 `<html>`의 `dark` 클래스를 맞춘다. */
export function applyTheme(): void {
  document.documentElement.classList.toggle("dark", readTheme() === "dark");
}

/** 화면 모드를 저장하고 바로 적용한다. */
export function writeTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장이 막힌 환경(사생활 보호 모드 등)에서는 이번 방문에만 적용된다.
  }
  applyTheme();
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
