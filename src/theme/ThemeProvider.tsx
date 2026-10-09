import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

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

export function ThemeProvider({ children, initialTheme = DEFAULT_THEME, initialScheme = "system" }: Props) {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);
  const [schemePreference, setSchemePreference] = useState<SchemePreference>(initialScheme);
  const deviceScheme = useColorScheme();

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
  }, [themeName, schemePreference, deviceScheme]);

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
