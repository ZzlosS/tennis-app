import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { readSetting, writeSetting } from "@/settings";
import { ThemeProvider, useTheme, useThemeSettings } from "@/theme";

function Probe() {
  const { name, scheme } = useTheme();
  const { setThemeName, setSchemePreference } = useThemeSettings();
  return (
    <>
      <Text>{`${name}/${scheme}`}</Text>
      <Pressable onPress={() => setThemeName("wimbledon")}>
        <Text>wimbledon</Text>
      </Pressable>
      <Pressable onPress={() => setSchemePreference("dark")}>
        <Text>dark</Text>
      </Pressable>
    </>
  );
}

const app = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );

test("a setting round-trips through storage", async () => {
  expect(await readSetting("missing")).toBeUndefined();
  await writeSetting("answer", { value: 42 });
  expect(await readSetting("answer")).toEqual({ value: 42 });
});

test("the look and light or dark choice survive a restart", async () => {
  const first = app();
  await act(async () => {});
  fireEvent.press(screen.getByText("wimbledon"));
  fireEvent.press(screen.getByText("dark"));
  expect(screen.getByText("wimbledon/dark")).toBeOnTheScreen();
  await waitFor(async () => expect(await readSetting("scheme")).toBe("dark"));
  first.unmount();

  app();
  expect(await screen.findByText("wimbledon/dark")).toBeOnTheScreen();
});
