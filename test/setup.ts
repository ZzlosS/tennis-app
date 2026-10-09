import { server } from "./msw";

process.env.EXPO_PUBLIC_API_URL = "http://api.test/v1";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
