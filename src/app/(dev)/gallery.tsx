import { Redirect } from "expo-router";
import { Pressable, View } from "react-native";

import { config } from "@/config";
import { themes, ThemeProvider, useThemeSettings, type ThemeName } from "@/theme";
import { Avatar, Button, Card, Divider, EmptyState, ErrorState, Screen, Tag, Text, TextInput } from "@/ui";

// Every shared component in every look, for checking against the design canvas.
// Only exists in development builds.
function Samples() {
  const { theme, themeName, setThemeName, schemePreference, setSchemePreference } = useThemeSettings();
  const names = Object.keys(themes) as ThemeName[];
  return (
    <Screen>
      <Text variant="title">Gallery</Text>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap" }}>
        {names.map((name) => (
          <Button
            key={name}
            title={name}
            variant={name === themeName ? "primary" : "secondary"}
            onPress={() => setThemeName(name)}
          />
        ))}
        <Button
          title={schemePreference === "dark" ? "light" : "dark"}
          variant="ghost"
          onPress={() => setSchemePreference(schemePreference === "dark" ? "light" : "dark")}
        />
      </View>
      <Text variant="h1">Heading one</Text>
      <Text variant="h2">Heading two</Text>
      <Text>Body text for reading.</Text>
      <Text tone="muted">Muted text for details.</Text>
      <Text variant="small" tone="primary">
        A small link-coloured line
      </Text>
      <Divider />
      <Button title="Primary" />
      <Button title="Secondary" variant="secondary" />
      <Button title="Ghost" variant="ghost" />
      <Button title="Danger" variant="danger" />
      <Button title="Loading" loading />
      <TextInput label="Email" placeholder="you@example.com" />
      <TextInput label="Password" secureTextEntry error="Wrong email or password." />
      <Card style={{ gap: theme.spacing.sm }}>
        <Text variant="bodyStrong">Club card</Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <Tag kind="CLUB" label="Club" />
          <Tag kind="PUBLIC" label="Public" />
          <Tag kind="PRIVATE" label="Private" />
        </View>
      </Card>
      <Pressable accessibilityRole="button">
        <Avatar name="Strahinja Example" />
      </Pressable>
      <View style={{ height: 160 }}>
        <EmptyState title="Nothing here yet" message="Empty state text." />
      </View>
      <View style={{ height: 200 }}>
        <ErrorState
          title="Something went wrong"
          message="Error state text."
          retryLabel="Try again"
          onRetry={() => {}}
        />
      </View>
    </Screen>
  );
}

export default function Gallery() {
  if (!config.isDev) return <Redirect href="/" />;
  return (
    <ThemeProvider>
      <Samples />
    </ThemeProvider>
  );
}
