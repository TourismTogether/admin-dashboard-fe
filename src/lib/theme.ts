export type ThemeId =
  | "white-black"
  | "pink-white"
  | "green-white"
  | "blue-white";

export interface ThemeOption {
  id: ThemeId;
  label: string;
}

export const THEME_STORAGE_KEY = "dashboard_theme";

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "white-black", label: "White - Black" },
  { id: "pink-white", label: "Pink - White" },
  { id: "green-white", label: "Green - White" },
  { id: "blue-white", label: "Blue - White" },
];

export const DEFAULT_THEME: ThemeId = "white-black";

export const isThemeId = (value: string): value is ThemeId =>
  THEME_OPTIONS.some((theme) => theme.id === value);

export const getStoredTheme = (): ThemeId => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (!stored) return DEFAULT_THEME;
  return isThemeId(stored) ? stored : DEFAULT_THEME;
};

export const applyTheme = (themeId: ThemeId) => {
  document.documentElement.setAttribute("data-theme", themeId);
};

export const setTheme = (themeId: ThemeId) => {
  applyTheme(themeId);
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
};

export const initializeTheme = () => {
  applyTheme(getStoredTheme());
};
