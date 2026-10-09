import { setupServer } from "msw/node";

/** One MSW server for the whole test run; tests add handlers with server.use(). */
export const server = setupServer();

/** The API base URL tests run against (see test/setup.ts). */
export const API = "http://api.test/v1";
