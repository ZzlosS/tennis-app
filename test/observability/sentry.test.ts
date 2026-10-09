jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
}));

function load() {
  let mod!: typeof import("@/observability/sentry");
  jest.isolateModules(() => {
    mod = require("@/observability/sentry");
  });
  return { ...mod, Sentry: jest.requireMock("@sentry/react-native") };
}

beforeEach(() => jest.clearAllMocks());

test("stays off without a DSN, and reporting is a no-op", () => {
  const { startCrashReporting, reportError, Sentry } = load();
  expect(startCrashReporting("")).toBe(false);
  reportError(new Error("x"));
  expect(Sentry.init).not.toHaveBeenCalled();
  expect(Sentry.captureException).not.toHaveBeenCalled();
});

test("starts once with a DSN and the app environment, without personal data", () => {
  const { startCrashReporting, Sentry } = load();
  expect(startCrashReporting("https://key@sentry.example/1")).toBe(true);
  expect(startCrashReporting("https://key@sentry.example/1")).toBe(true);
  expect(Sentry.init).toHaveBeenCalledTimes(1);
  expect(Sentry.init).toHaveBeenCalledWith(
    expect.objectContaining({
      dsn: "https://key@sentry.example/1",
      environment: "development",
      sendDefaultPii: false,
    }),
  );
});

test("events lose tokens, emails and request bodies", () => {
  const { scrubEvent, scrubBreadcrumb } = load();
  const event = scrubEvent({
    type: undefined,
    user: { id: "p1", email: "ana@example.rs" },
    request: {
      headers: { Authorization: "Bearer A1", Accept: "application/json" },
      data: '{"password":"x"}',
    },
  });
  expect(event.user).toEqual({ id: "p1" });
  expect(event.request).toEqual({ headers: { Accept: "application/json" } });

  const crumb = scrubBreadcrumb({
    category: "fetch",
    data: { method: "POST", url: "/v1/auth/login", status_code: 401, request_body: "secret" },
  });
  expect(crumb.data).toEqual({ method: "POST", url: "/v1/auth/login", status_code: 401 });
});
