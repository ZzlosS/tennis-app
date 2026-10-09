import { spacing, type Theme, type ThemeColors } from "../tokens";

// Values from the "Wimbledon" page of the design canvas: deep green and purple on cream,
// DM Serif Display headings with Libre Franklin text.
const light: ThemeColors = {
  background: "#F7F3E8",
  surface: "#FFFDF7",
  card: "#FFFDF7",
  text: "#0E3B2C",
  textMuted: "#4D5A50",
  border: "#CBC2AA",
  primary: "#0E3B2C",
  primaryPressed: "#13462F",
  onPrimary: "#F7F3E8",
  accent: "#4A2667",
  danger: "#9B1C1C",
  onDanger: "#F7F3E8",
  tabInactive: "#4D5A50",
  courtClub: { background: "#E6DDC6", text: "#0E3B2C" },
  courtPublic: { background: "#DCEBDF", text: "#0E3B2C" },
  courtPrivate: { background: "#E9DDF1", text: "#4A2667" },
  surfaceTile: { CLAY: "#F3E1D7", HARD: "#DCE6F7", GRASS: "#DDEBDC" },
};

const dark: ThemeColors = {
  background: "#0B241B",
  surface: "#123528",
  card: "#102E23",
  text: "#F7F3E8",
  textMuted: "#C9C1AC",
  border: "#2C4A3D",
  primary: "#E6DDC6",
  primaryPressed: "#D4C9AC",
  onPrimary: "#0E3B2C",
  accent: "#C9A8E0",
  danger: "#F59E9E",
  onDanger: "#0B241B",
  tabInactive: "#C9C1AC",
  courtClub: { background: "#2C4A3D", text: "#F7F3E8" },
  courtPublic: { background: "#1D4A36", text: "#CDEBD6" },
  courtPrivate: { background: "#3B2550", text: "#E9DDF1" },
  surfaceTile: { CLAY: "#4A2E24", HARD: "#22324D", GRASS: "#22402A" },
};

const base = {
  name: "wimbledon",
  fonts: {
    heading: "DMSerifDisplay_400Regular",
    regular: "LibreFranklin_400Regular",
    medium: "LibreFranklin_500Medium",
    semibold: "LibreFranklin_600SemiBold",
    bold: "LibreFranklin_700Bold",
  },
  fontSize: { title: 44, h1: 30, h2: 22, body: 16, small: 13, tiny: 12 },
  spacing,
  radius: { control: 4, card: 6, pill: 999 },
  button: { height: 52, uppercase: true, letterSpacing: 1 },
  cardShadow: false,
} as const;

export const wimbledon: Record<"light" | "dark", Theme> = {
  light: { ...base, scheme: "light", colors: light },
  dark: { ...base, scheme: "dark", colors: dark },
};
