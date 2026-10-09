# Rally (tennis app)

One Expo + React Native app for Android, iOS and web, for the [tennis backend](https://github.com/ZzlosS/tennis).
"Rally" is a placeholder name.

## Run it

Needs Node 22.

```bash
npm install
cp example.env .env.local   # then set EXPO_PUBLIC_API_URL
npm run web                 # browser at http://localhost:8081
npm start                   # then scan the QR code with Expo Go, or press a / i
```

`EXPO_PUBLIC_API_URL` points at the API, including `/v1`:

| Backend                                          | URL                                             |
| ------------------------------------------------ | ----------------------------------------------- |
| Local backend (`npm run dev` in `ZzlosS/tennis`) | `http://localhost:8787/v1`                      |
| Backend mock (`npm run mock` in `ZzlosS/tennis`) | `http://localhost:4010` (the mock has no `/v1`) |
| Android emulator to a local backend              | `http://10.0.2.2:8787/v1`                       |

The backend's `CORS_ORIGINS` must include `http://localhost:8081` for the web app (it does by default).

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
Each sets `APP_ENV`, which `app.config.ts` uses for the app name. Phone builds need an Expo project:
set `EAS_PROJECT_ID` before `npx eas-cli@latest build`.
