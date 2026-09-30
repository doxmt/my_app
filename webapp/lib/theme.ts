/** 웹 화면 모드. 저장값이 없으면 라이트가 기본이다(기기 설정은 따르지 않는다). */
export type ThemePreference = "light" | "dark";

export const DEFAULT_THEME: ThemePreference = "light";
export const THEME_STORAGE_KEY = "theme";
export const THEME_CHANGE_EVENT = "themechange";

export function parseThemePreference(raw: string | null): ThemePreference | null {
  return raw === "light" || raw === "dark" ? raw : null;
}

export function resolveTheme(preference: ThemePreference | null): ThemePreference {
  return preference ?? DEFAULT_THEME;
}

/**
 * 첫 페인트 전에 `dark` 클래스를 붙여 깜빡임을 막는 인라인 스크립트.
 * `resolveTheme`와 같은 규칙을 유지할 것(저장값이 dark일 때만 다크).
 */
export const THEME_INIT_SCRIPT = `(function(){try{document.documentElement.classList.toggle('dark',localStorage.getItem('${THEME_STORAGE_KEY}')==='dark');}catch(e){}})();`;
