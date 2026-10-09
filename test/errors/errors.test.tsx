import { act, fireEvent, renderHook, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Text } from "react-native";

import { ApiError } from "@/api";
import { AppErrorBoundary, useErrorMessage } from "@/errors";
import i18n from "@/i18n";

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
}));

describe("useErrorMessage", () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage("en"));
  });

  test("API errors are translated by code, anything else falls back to INTERNAL", async () => {
    const { result } = renderHook(() => useErrorMessage());
    expect(result.current(new ApiError(409, "SLOT_TAKEN", "Slot taken"))).toBe(
      "Someone just booked that time. Pick another slot.",
    );
    expect(result.current(new Error("kaboom"))).toBe(
      "Something went wrong on our side. Try again in a moment.",
    );
    expect(result.current("odd")).toBe("Something went wrong on our side. Try again in a moment.");

    await act(() => i18n.changeLanguage("sr"));
    const { result: sr } = renderHook(() => useErrorMessage());
    expect(sr.current(new ApiError(0, "NETWORK_ERROR", "offline"))).toBe(
      "Server nije dostupan. Proverite internet vezu.",
    );
  });
});

describe("a crashing screen", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  test("shows a retry screen, reports the error, and recovers on retry", async () => {
    const Sentry = jest.requireMock("@sentry/react-native");
    const { startCrashReporting } = require("@/observability/sentry");
    startCrashReporting("https://key@sentry.example/1");

    let broken = true;
    function Flaky() {
      if (broken) throw new Error("render failed");
      return <Text>Back again</Text>;
    }

    renderRouter({ index: { default: Flaky, ErrorBoundary: AppErrorBoundary } });
    expect(await screen.findByText("Something went wrong")).toBeOnTheScreen();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "render failed" }),
    );

    broken = false;
    fireEvent.press(screen.getByText("Try again"));
    expect(await screen.findByText("Back again")).toBeOnTheScreen();
  });
});
