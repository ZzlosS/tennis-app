import NetInfo from "@react-native-community/netinfo";
import { screen } from "@testing-library/react-native";

import { OfflineBanner } from "@/ui";
import { renderWithProviders } from "../render";

const useNetInfo = jest.spyOn(NetInfo as unknown as { useNetInfo: () => unknown }, "useNetInfo");

test("shows only when the device is known to be offline", () => {
  useNetInfo.mockReturnValue({ isConnected: true });
  const { rerender } = renderWithProviders(<OfflineBanner />);
  expect(screen.queryByText(/offline/)).toBeNull();

  useNetInfo.mockReturnValue({ isConnected: null });
  rerender(<OfflineBanner />);
  expect(screen.queryByText(/offline/)).toBeNull();

  useNetInfo.mockReturnValue({ isConnected: false });
  rerender(<OfflineBanner />);
  expect(screen.getByText("You are offline. Some things may not load.")).toBeOnTheScreen();
});
