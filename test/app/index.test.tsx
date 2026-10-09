import { screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";

import RootLayout from "@/app/_layout";
import Index from "@/app/index";

test("the root route renders", async () => {
  renderRouter({ _layout: RootLayout, index: Index });
  expect(await screen.findByText("Rally")).toBeOnTheScreen();
});
