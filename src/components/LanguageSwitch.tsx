import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { languages, type Language } from "@/i18n";
import { useLanguage } from "@/i18n/useLanguage";
import { useTheme } from "@/theme";
import { Text } from "@/ui";

type Props = {
  /** Called after the app language changes, e.g. to save it to the player's profile. */
  onChange?: (language: Language) => void;
};

/** EN / SR pills, as on the sign-in screen of the design canvas. */
export function LanguageSwitch({ onChange }: Props) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { colors, radius } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t("language.title")}
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        padding: 3,
      }}
    >
      {languages.map((code) => {
        const selected = code === language;
        return (
          <Pressable
            key={code}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t(`language.${code}`)}
            onPress={async () => {
              if (selected) return;
              await setLanguage(code);
              onChange?.(code);
            }}
            style={{
              minWidth: 48,
              height: 36,
              paddingHorizontal: 12,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? colors.card : "transparent",
            }}
          >
            <Text variant="label" tone={selected ? "default" : "muted"}>
              {code.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
