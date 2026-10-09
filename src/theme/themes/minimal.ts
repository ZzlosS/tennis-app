import { spacing, type Theme, type ThemeColors } from "../tokens";

// Values from the "Minimal" page of the design canvas: white space, one green accent, Figtree.
const light: ThemeColors = {
  background: "#FFFFFF",
  surface: "#F5F6F7",
  card: "#FFFFFF",
  text: "#111418",
  textMuted: "#5F6670",
  border: "#E7E9EC",
  primary: "#0B7A4F",
  primaryPressed: "#075C3B",
  onPrimary: "#FFFFFF",
  accent: "#0B7A4F",
  danger: "#B42318",
  onDanger: "#FFFFFF",
  tabInactive: "#5F6670",
  courtClub: { background: "#F0F1F3", text: "#111418" },
  courtPublic: { background: "#E6F4EC", text: "#0B6B45" },
  courtPrivate: { background: "#FDF0E6", text: "#8A3B0C" },
  surfaceTile: { CLAY: "#F3E1D7", HARD: "#DCE6F7", GRASS: "#DDEBDC" },
};

const dark: ThemeColors = {
  background: "#0E1013",
  surface: "#1A1D21",
  card: "#15181C",
  text: "#F2F4F6",
  textMuted: "#A3AAB3",
  border: "#2A2E34",
  primary: "#3CC48A",
  primaryPressed: "#2FA574",
  onPrimary: "#0E1013",
  accent: "#3CC48A",
  danger: "#F97066",
  onDanger: "#0E1013",
  tabInactive: "#A3AAB3",
  courtClub: { background: "#2A2E34", text: "#F2F4F6" },
  courtPublic: { background: "#123524", text: "#7EE0B0" },
  courtPrivate: { background: "#3A2112", text: "#F7B98C" },
  surfaceTile: { CLAY: "#4A2E24", HARD: "#22324D", GRASS: "#22402A" },
};

const base = {
  name: "minimal",
  fonts: {
    heading: "Figtree_700Bold",
    regular: "Figtree_400Regular",
    medium: "Figtree_500Medium",
    semibold: "Figtree_600SemiBold",
    bold: "Figtree_700Bold",
  },
  fontSize: { title: 32, h1: 28, h2: 20, body: 16, small: 13, tiny: 11 },
  spacing,
  radius: { control: 14, card: 18, pill: 999 },
  button: { height: 54, uppercase: false, letterSpacing: 0 },
  cardShadow: true,
} as const;

export const minimal: Record<"light" | "dark", Theme> = {
  light: { ...base, scheme: "light", colors: light },
  dark: { ...base, scheme: "dark", colors: dark },
};
