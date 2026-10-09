import { router, type Href } from "expo-router";

/** Back one screen, or to `fallback` when the screen was opened directly (a link, a reload on web). */
export function goBack(fallback: Href = "/home") {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
