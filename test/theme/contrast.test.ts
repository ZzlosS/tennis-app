import { themes } from "@/theme";
import { contrastRatio } from "@/theme/contrast";
import type { ThemeColors } from "@/theme/tokens";

// Text on its background must reach WCAG AA (4.5:1) in every look and both light and dark.
const pairs: [keyof ThemeColors | string, (c: ThemeColors) => [string, string]][] = [
  ["text on background", (c) => [c.text, c.background]],
  ["text on surface", (c) => [c.text, c.surface]],
  ["text on card", (c) => [c.text, c.card]],
  ["muted text on background", (c) => [c.textMuted, c.background]],
  ["muted text on surface", (c) => [c.textMuted, c.surface]],
  ["inactive tab on background", (c) => [c.tabInactive, c.background]],
  ["button text on primary", (c) => [c.onPrimary, c.primary]],
  ["button text on pressed primary", (c) => [c.onPrimary, c.primaryPressed]],
  ["link on background", (c) => [c.primary, c.background]],
  ["accent on background", (c) => [c.accent, c.background]],
  ["danger on background", (c) => [c.danger, c.background]],
  ["text on danger", (c) => [c.onDanger, c.danger]],
  ["club tag", (c) => [c.courtClub.text, c.courtClub.background]],
  ["public tag", (c) => [c.courtPublic.text, c.courtPublic.background]],
  ["private tag", (c) => [c.courtPrivate.text, c.courtPrivate.background]],
];

const sets = Object.values(themes).flatMap((byScheme) => Object.values(byScheme));

describe.each(sets.map((t) => [`${t.name} ${t.scheme}`, t] as const))("%s", (_, theme) => {
  test.each(pairs)("%s reaches 4.5:1", (_, pick) => {
    const [fg, bg] = pick(theme.colors);
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
