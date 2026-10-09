import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { readSetting, writeSetting } from "@/settings";

import { DEFAULT_THEME, themes } from "./themes";
import type { ColorScheme, Theme, ThemeName } from "./tokens";

export type SchemePreference = ColorScheme | "system";

type ThemeContextValue = {
  theme: Theme;
  themeName: ThemeName;
  schemePreference: SchemePreference;
  setThemeName: (name: ThemeName) => void;
  setSchemePreference: (scheme: SchemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type Props = {
  children: ReactNode;
  initialTheme?: ThemeName;
  initialScheme?: SchemePreference;
};

const THEME_KEY = "theme";
const SCHEME_KEY = "scheme";
const isThemeName = (value: unknown): value is ThemeName => typeof value === "string" && value in themes;
const isScheme = (value: unknown): value is SchemePreference =>
  value === "light" || value === "dark" || value === "system";

/**
 * The look and light/dark choice, remembered between launches. `initialTheme` and `initialScheme`
 * (used by tests and the gallery) win over the saved choice.
 */
export function ThemeProvider({ children, initialTheme, initialScheme }: Props) {
  const [themeName, setThemeNameState] = useState<ThemeName>(initialTheme ?? DEFAULT_THEME);
  const [schemePreference, setSchemeState] = useState<SchemePreference>(initialScheme ?? "system");
  const deviceScheme = useColorScheme();
  // A choice made before the saved one has loaded must not be overwritten by it.
  const touched = useRef({ theme: initialTheme != null, scheme: initialScheme != null });

  useEffect(() => {
    let live = true;
    void (async () => {
      const [savedTheme, savedScheme] = await Promise.all([
        readSetting<string>(THEME_KEY),
        readSetting<string>(SCHEME_KEY),
      ]);
      if (!live) return;
      if (!touched.current.theme && isThemeName(savedTheme)) setThemeNameState(savedTheme);
      if (!touched.current.scheme && isScheme(savedScheme)) setSchemeState(savedScheme);
    })();
    return () => {
      live = false;
    };
  }, []);

  const setThemeName = useCallback((name: ThemeName) => {
    touched.current.theme = true;
    setThemeNameState(name);
    void writeSetting(THEME_KEY, name);
  }, []);

  const setSchemePreference = useCallback((scheme: SchemePreference) => {
    touched.current.scheme = true;
    setSchemeState(scheme);
    void writeSetting(SCHEME_KEY, scheme);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: ColorScheme =
      schemePreference === "system" ? (deviceScheme === "dark" ? "dark" : "light") : schemePreference;
    return {
      theme: themes[themeName][scheme],
      themeName,
      schemePreference,
      setThemeName,
      setSchemePreference,
    };
  }, [themeName, schemePreference, deviceScheme, setThemeName, setSchemePreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSettings(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}

export function useTheme(): Theme {
  return useThemeSettings().theme;
}
