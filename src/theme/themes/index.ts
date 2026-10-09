import type { ColorScheme, Theme, ThemeName } from "../tokens";
import { minimal } from "./minimal";
import { wimbledon } from "./wimbledon";

export const themes: Record<ThemeName, Record<ColorScheme, Theme>> = { minimal, wimbledon };

/** Minimal is the default look (decided 2026-10-09); Wimbledon is the alternative. */
export const DEFAULT_THEME: ThemeName = "minimal";
