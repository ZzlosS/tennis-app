import { screen } from "@testing-library/react-native";
import { act } from "react";

import i18n from "@/i18n";
import { CourtKindTag, Price } from "@/ui";
import { renderWithProviders } from "../render";

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

test("price per hour, and free in both languages", async () => {
  renderWithProviders(
    <>
      <Price price={{ amountMinor: 180000, currency: "RSD" }} perHour />
      <Price price={null} />
      <CourtKindTag kind="PRIVATE" />
    </>,
  );
  expect(screen.getByText(/^RSD\s?1,800\/h$/)).toBeOnTheScreen();
  expect(screen.getByText("Free")).toBeOnTheScreen();
  expect(screen.getByText("Private")).toBeOnTheScreen();

  await act(() => i18n.changeLanguage("sr"));
  expect(screen.getByText(/^1\.800\sRSD\/h$/)).toBeOnTheScreen();
  expect(screen.getByText("Besplatno")).toBeOnTheScreen();
  expect(screen.getByText("Privatni")).toBeOnTheScreen();
});
