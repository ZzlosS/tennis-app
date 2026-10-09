// What the rest of the app may import from the API layer. ESLint blocks direct imports of
// src/api/generated/* and calls to fetch() everywhere else, so all API calls go through here.
export * from "./generated/endpoints";
export * from "./generated/model";
export { ApiError, isApiError, allErrorCodes, type ApiErrorCode } from "./errors";
export { tokens, type Session, type TokenStorage } from "./tokens";
export { createQueryClient, refetchOnAppFocus } from "./queryClient";
export { usePagedList, type Page } from "./paging";
export { invalidatePaths, useInvalidate, areas, type Area } from "./invalidate";
