# Rally (tennis app)

One Expo + React Native app for Android, iOS and web, for the [tennis backend](https://github.com/ZzlosS/tennis).
"Rally" is a placeholder name.

## Run it

Needs Node 22.

```bash
npm install
cp example.env .env.local   # EXPO_PUBLIC_API_URL=auto finds a local backend by itself
npm run web                 # browser at http://localhost:8081
npm start                   # then scan the QR code with Expo Go, or press a / i
```

`EXPO_PUBLIC_API_URL` points at the API, including `/v1`. After changing it, restart Metro with `npx expo start -c`;
the value is built into the bundle, so a reload keeps the old one.

| Backend                                          | URL                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Local backend (`npm run dev` in `ZzlosS/tennis`) | `auto`: the computer running Metro, port 8787 (web, simulator, emulator, phone on Wi-Fi) |
| Local backend, fixed address                     | `http://localhost:8787/v1` (web, iOS simulator, after `adb reverse`)                     |
| Android emulator, fixed address                  | `http://10.0.2.2:8787/v1`                                                                |
| Backend mock (`npm run mock` in `ZzlosS/tennis`) | `http://localhost:4010` (the mock has no `/v1`)                                          |

The backend's `CORS_ORIGINS` must include `http://localhost:8081` for the web app (it does by default).

## Run on an emulator or a phone

The whole guide, with debugging, is the
[local development and debugging plan](https://claude.ai/artifact/W2hUFqEgqj1VGMBfxtQsQF). In short:

- **iOS simulator (macOS):** install Xcode, `npm start`, press `i`.
- **Android emulator:** create a device with Google Play in Android Studio, start it, `npm start`, press `a`.
- **Android phone on USB:** turn on USB debugging, then `adb reverse tcp:8787 tcp:8787` and
  `adb reverse tcp:8081 tcp:8081`, and open the app from Expo Go.
- **Any phone on the same Wi-Fi:** scan the QR code with Expo Go. If the app can't reach the API, open
  `http://<your computer's IP>:8787/health` on the phone; if that fails, allow Node through the computer's firewall.
- **Push notifications** don't work in Expo Go. Build a development build once with
  `npx eas-cli@latest build --profile development --platform android`, install it from the link EAS prints, and
  open the project from it while `npm start` runs. Rebuild only when native packages or plugins change.

## How the code is laid out

| Folder                       | What lives there                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                   | Screens. Every file is a route (Expo Router): `(auth)` sign-in screens, `(tabs)` the signed-in app, `reset-password` and `verify-email` for email links. |
| `src/api/`                   | The only code that talks to the backend. `src/api/generated/` is generated; import everything from `@/api`.                                              |
| `src/auth/`                  | Session restore, sign in, register, sign out, and where tokens are stored per platform.                                                                  |
| `src/theme/`                 | Theme tokens. `themes/minimal.ts` (default) and `themes/wimbledon.ts`, each light and dark.                                                              |
| `src/ui/`, `src/components/` | Shared building blocks. They take colours and fonts from the theme, never raw values.                                                                    |
| `src/i18n/`                  | Translations: one file per language in `locales/`.                                                                                                       |
| `src/format/`                | Money in a club's currency and dates in a club's time zone.                                                                                              |

## Rules that are checked

- **All API calls go through `@/api`.** ESLint fails on `fetch()` or a generated import anywhere else.
- **No typed text in screens.** Use `t("…")`; keys are typed, so a wrong key fails `npm run typecheck`.
- **Errors are shown by code.** `useErrorMessage()` turns any error into `errors.<CODE>` text; a test fails if a code
  from the API spec has no text in every language.
- **Colours pass contrast.** A test checks every text colour in every theme reaches WCAG AA (4.5:1).

## When the backend API changes

```bash
npm run api:sync -- --from ../tennis    # or: --ref <commit>, with GITHUB_TOKEN for a private repo
npm run api:generate
```

Commit `api/openapi.json`, `api/SPEC_VERSION` and `src/api/generated/` together. CI's `api:check` fails if the
generated code does not match the committed spec.

## Adding a language

Copy `src/i18n/locales/en.json` to `<code>.json`, translate it, and add it to `resources` and `languages` in
`src/i18n/index.ts`. The locale tests check it has every key.

## Checks

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run export:web
```

CI runs all of them on every pull request.

## Builds

`eas.json` has three profiles: `development` (dev client), `preview` (internal testing) and `production`.
Each sets `APP_ENV`, which `app.config.ts` uses for the app name. The Expo project id is in `app.config.ts`
(`EAS_PROJECT_ID` overrides it), so push notifications work on real phones and `npx eas-cli@latest build`
finds the project. The project's slug on expo.dev is `ajmo` and must match `slug` here; the owner is the `sstrales-team`
Expo account (`EXPO_OWNER` overrides it for a fork).
