import { screen } from "@testing-library/react-native";

import { openSignedIn } from "./signedIn";

test("a player who opens a club admin link is sent to their profile", async () => {
  await openSignedIn("/club-admin/club1/today", { role: "PLAYER" });
  expect(await screen.findByText("Ana Ivanović")).toBeOnTheScreen();
  expect(screen).toHavePathname("/profile");
});
