# expo-app-integrity-example

A real Expo (SDK 56) app that proves requests come from a genuine, untampered
build on a real device, using
[`@expo/app-integrity`](https://docs.expo.dev/versions/v56.0.0/sdk/app-integrity/)
— Apple **App Attest** on iOS and Google **Play Integrity** on Android — with
**server-side verification** via Expo Router API routes.

The client requests a one-time challenge, runs the platform attestation flow, and
posts the result back. The server verifies it with
[`node-app-attest`](https://github.com/uebelack/node-app-attest) (iOS) and
[`@googleapis/playintegrity`](https://www.npmjs.com/package/@googleapis/playintegrity)
(Android).

## ⚠️ Requirements

- **Real device only.** App Attest and Play Integrity do not work on the iOS
  Simulator or Android emulator, nor in Expo Go (App Attest needs an entitlement).
  Use a development build.
- **The server runs on Node.** The verification packages are Node-only, so the API
  routes cannot run on Cloudflare Workers / EAS Hosting. Run them with
  `expo serve` for dev, or self-host the exported server on any Node platform.
- **Credentials** from Apple and Google are required (see [Configuration](#configuration)).

## Setup

```sh
npm install
cp .env.example .env   # fill in your values
```

## Run (development, real device)

1. Start the Node server with the API routes:

   ```sh
   npx expo serve
   ```

2. Build and run a development build on a connected device:

   ```sh
   npx expo run:ios     # device with the App Attest capability
   npx expo run:android # device with Play Integrity configured
   ```

   For a device to reach the API routes, set `EXPO_PUBLIC_API_URL` to a URL the
   device can reach (your machine's LAN URL, or a deployed server).

3. Tap **Run attestation** and watch the result log.

> Dev builds use the **development** App Attest environment. Set
> `APP_ATTEST_ENVIRONMENT=development` and the server's
> `IOS_ALLOW_DEVELOPMENT_ENVIRONMENT=true` (the `development` EAS build profile
> already sets the former).

## TestFlight

1. Deploy the server to a **publicly reachable Node host** and set
   `EXPO_PUBLIC_API_URL` to that URL — a production native build does **not**
   embed the API routes.
2. Use the production App Attest environment (default): `APP_ATTEST_ENVIRONMENT=production`
   and server `IOS_ALLOW_DEVELOPMENT_ENVIRONMENT=false`.
3. Build and submit:

   ```sh
   eas build --platform ios --profile production
   eas submit --platform ios --profile production
   ```

## Configuration

### Apple (App Attest)

- Server: set `IOS_BUNDLE_IDENTIFIER`, `IOS_TEAM_IDENTIFIER`, and
  `IOS_ALLOW_DEVELOPMENT_ENVIRONMENT`.

### Google (Play Integrity)

- Enable the Play Integrity API, note your **cloud project number**, and set
  `EXPO_PUBLIC_CLOUD_PROJECT_NUMBER`.
- Create a service account with Play Integrity access, download its JSON key, and
  point `GOOGLE_APPLICATION_CREDENTIALS` at the file. Set
  `GOOGLE_PLAY_APP_PACKAGE_NAME`.

> The in-memory store in `src/helpers/store.ts` is for demonstration. A real backend
> would persist challenges and attested keys in a database.

## Project structure

```
src
├── app
│   ├── _layout.tsx                 Expo Router stack
│   ├── index.tsx                   Client UI + attestation flow
│   └── api
│       ├── challenge+api.ts        Issues one-time challenges
│       └── verify+api.ts           Verifies attestations/tokens
└── helpers
    ├── store.ts                    In-memory challenge & key store
    ├── verify-ios.ts               App Attest (node-app-attest)
    ├── verify-android.ts           Play Integrity (@googleapis/playintegrity)
    └── is-valid-android-request.ts Play Integrity verdict checks
```

## Notes

- [Expo App Integrity (v56)](https://docs.expo.dev/versions/v56.0.0/sdk/app-integrity/)
- [node-app-attest](https://github.com/uebelack/node-app-attest)
- [@googleapis/playintegrity](https://www.npmjs.com/package/@googleapis/playintegrity)
- [Google — Play Integrity standard requests](https://developer.android.com/google/play/integrity/standard)
