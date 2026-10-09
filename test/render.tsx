import { render, type RenderOptions } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider, type ThemeName } from "@/theme";
import type { SchemePreference } from "@/theme/ThemeProvider";

type Options = RenderOptions & { theme?: ThemeName; scheme?: SchemePreference };

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export function Providers({
  children,
  theme,
  scheme,
}: {
  children: ReactNode;
  theme?: ThemeName;
  scheme?: SchemePreference;
}) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider initialTheme={theme} initialScheme={scheme}>
        {children}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Renders inside the app's providers, in the given look (Minimal light by default). */
export function renderWithProviders(ui: ReactElement, { theme, scheme = "light", ...options }: Options = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <Providers theme={theme} scheme={scheme}>
        {children}
      </Providers>
    ),
    ...options,
  });
}
