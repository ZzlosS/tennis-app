import { fireEvent, screen } from "@testing-library/react-native";

import { themes, type ThemeName } from "@/theme";
import { Avatar, Button, Card, EmptyState, ErrorState, initials, Tag, Text, TextInput } from "@/ui";
import { renderWithProviders } from "../render";

const looks = (Object.keys(themes) as ThemeName[]).flatMap((theme) =>
  (["light", "dark"] as const).map((scheme) => [theme, scheme] as const),
);

describe.each(looks)("%s %s", (theme, scheme) => {
  const opts = { theme, scheme };

  test("text uses the theme's text colour and fonts", () => {
    renderWithProviders(<Text variant="h1">Hello</Text>, opts);
    expect(screen.getByText("Hello")).toHaveStyle({
      color: themes[theme][scheme].colors.text,
      fontFamily: themes[theme][scheme].fonts.heading,
    });
    expect(screen.getByRole("header")).toBeOnTheScreen();
  });

  test("a button presses and a loading button does not", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <>
        <Button title="Go" onPress={onPress} />
        <Button title="Wait" loading onPress={onPress} testID="busy" />
      </>,
      opts,
    );
    fireEvent.press(screen.getByText("Go"));
    fireEvent.press(screen.getByTestId("busy"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Wait")).toBeNull();
  });

  test("an input has its label and shows an error", () => {
    renderWithProviders(<TextInput label="Email" error="Required" />, opts);
    expect(screen.getByLabelText("Email")).toBeOnTheScreen();
    expect(screen.getByText("Required")).toBeOnTheScreen();
  });

  test("tags, cards, avatars and states render", () => {
    const onRetry = jest.fn();
    renderWithProviders(
      <Card>
        <Tag kind="PUBLIC" label="Public" />
        <Avatar name="Ana Ivanović" />
        <EmptyState title="Nothing yet" />
        <ErrorState title="Oops" retryLabel="Try again" onRetry={onRetry} />
      </Card>,
      opts,
    );
    expect(screen.getByText("Public")).toHaveStyle({
      color: themes[theme][scheme].colors.courtPublic.text,
    });
    expect(screen.getByText("AI")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalled();
  });
});

test("initials take the first and last name", () => {
  expect(initials("Novak Đoković")).toBe("NĐ");
  expect(initials("  Ana  ")).toBe("A");
  expect(initials("Jelena Marija Janković")).toBe("JJ");
});
