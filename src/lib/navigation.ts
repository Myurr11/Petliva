import { router } from "expo-router";

/**
 * Goes back if there's actually a screen to go back to. Some screens are
 * reached via router.replace() (sign-in -> onboarding, for example) rather
 * than push(), which clears history — calling router.back() from there has
 * nothing to pop and throws "GO_BACK was not handled by any navigator".
 *
 * If there's no history and a fallbackHref is given, replaces to it instead
 * (so the user doesn't get stuck). If no fallback is given, does nothing —
 * callers that render a back button conditionally (via canGoBack()) should
 * use that instead so a dead button never shows in the first place.
 */
export function safeBack(fallbackHref?: string) {
  if (router.canGoBack()) {
    router.back();
  } else if (fallbackHref) {
    router.replace(fallbackHref as any);
  }
}
