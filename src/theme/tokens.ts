// Every colour, size and font in the app comes from a Theme. Screens never use raw values,
// so switching between the Minimal and Wimbledon looks is a token change, not a rewrite.

export type ThemeName = "minimal" | "wimbledon";
export type ColorScheme = "light" | "dark";

export type TagColors = { background: string; text: string };

export type ThemeColors = {
  /** Screen background. */
  background: string;
  /** Inputs, chips, segmented controls. */
  surface: string;
  /** Cards and sheets on top of the background. */
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  /** A second brand colour; equals primary in themes that have only one. */
  accent: string;
  danger: string;
  onDanger: string;
  tabInactive: string;
  /** Tags and map pins for the three kinds of court. */
  courtClub: TagColors;
  courtPublic: TagColors;
  courtPrivate: TagColors;
  /** The coloured tile that stands in for a court photo, by surface. Decoration only, never behind text. */
  surfaceTile: { CLAY: string; HARD: string; GRASS: string };
};

export type ThemeFonts = {
  heading: string;
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
};

export type Theme = {
  name: ThemeName;
  scheme: ColorScheme;
  colors: ThemeColors;
  fonts: ThemeFonts;
  /** Font sizes in points. */
  fontSize: { title: number; h1: number; h2: number; body: number; small: number; tiny: number };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  radius: { control: number; card: number; pill: number };
  /** Buttons in some looks are uppercase with tracking. */
  button: { height: number; uppercase: boolean; letterSpacing: number };
  /** Whether cards float on a soft shadow (true) or sit on a border (false). */
  cardShadow: boolean;
};

export const spacing: Theme["spacing"] = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
