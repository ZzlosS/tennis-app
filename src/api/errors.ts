import { ErrorCode } from "./generated/model/errorCode";

/** Error codes the app adds for failures that never reach the API. */
export const ClientErrorCode = {
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

export type ApiErrorCode = ErrorCode | (typeof ClientErrorCode)[keyof typeof ClientErrorCode];

/** Every code the app may need to translate: the API's plus the app's own. */
export const allErrorCodes: ApiErrorCode[] = [...Object.values(ErrorCode), ...Object.values(ClientErrorCode)];

/**
 * Any failed API call. Screens show `t(\`errors.${code}\`)`, never `message`,
 * which is English text meant for developers.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string[]>;

  constructor(status: number, code: ApiErrorCode, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const knownCodes = new Set<string>(allErrorCodes);

/** Turns a non-2xx response body into an ApiError, whatever shape it has. */
export function toApiError(status: number, body: unknown): ApiError {
  const error = (body as { error?: { code?: unknown; message?: unknown; fields?: unknown } } | null)?.error;
  const code =
    typeof error?.code === "string" && knownCodes.has(error.code) ? (error.code as ApiErrorCode) : "INTERNAL";
  const message = typeof error?.message === "string" ? error.message : `HTTP ${status}`;
  const fields =
    error?.fields && typeof error.fields === "object"
      ? (error.fields as Record<string, string[]>)
      : undefined;
  return new ApiError(status, code, message, fields);
}
