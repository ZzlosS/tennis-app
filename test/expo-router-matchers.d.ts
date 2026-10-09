// expo-router/testing-library adds these matchers at runtime but ships no types for them.
declare namespace jest {
  interface Matchers<R> {
    toHavePathname(pathname: string): R;
    toHaveSearchParams(params: Record<string, string>): R;
  }
}
