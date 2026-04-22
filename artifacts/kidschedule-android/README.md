# KidSchedule — Android Wrapper

A minimal Android app that wraps the live KidSchedule website inside a full-screen
WebView, ready to be packaged as a signed AAB for Google Play.

This is intentionally a thin shell — the website is the source of truth, so
shipping a website update is enough for users to see the change on next app
open. The only native feature is **Google Play Billing** (via RevenueCat), so
the app can sell Premium subscriptions in a Play-policy-compliant way.

> **Important:** Android source code cannot be built inside Replit (no Android
> SDK / JDK toolchain). Open this folder in **Android Studio Hedgehog (2023.1.1)
> or newer** on your local machine to build, run, and release.

---

## 1. Prerequisites

- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17 (bundled with Android Studio)
- Android SDK 34 (installed via Android Studio's SDK Manager)
- A deployed, publicly reachable HTTPS URL of the KidSchedule site

## 2. First-time setup

```bash
# 1. Open this folder in Android Studio (File → Open → select kidschedule-android)
# 2. Let Gradle sync finish (downloads dependencies on first run)
```

The Gradle wrapper (`gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`)
is already committed, so `./gradlew` works out of the box — no extra setup
needed.

## 3. Configure the wrapper URL

The app loads a single URL on launch. The default is set in
`app/build.gradle.kts` (`WRAPPER_URL` build config field), but the recommended
way is to pass it at build time:

```bash
./gradlew assembleDebug -PwrapperUrl=https://kidschedule.example.com
```

To change the default permanently, edit the `wrapperUrl` line in
`app/build.gradle.kts`.

## 4. Run on an emulator / device

```bash
# Build and install the debug APK on a connected device or emulator
./gradlew installDebug -PwrapperUrl=https://kidschedule.example.com
```

Or in Android Studio: pick a device from the toolbar and click **Run ▶**.

## 5. Bump the version

Before every Play Store release, bump both fields in `app/build.gradle.kts`:

- `versionCode` — integer, **must increase by at least 1** for every upload
- `versionName` — human-readable string (e.g. `"1.0.1"`)

## 6. Generate a release keystore (one-time)

```bash
bash scripts/generate-keystore.sh
```

This creates `~/.kidschedule-keystore/kidschedule-release.jks`. Follow the
printed instructions to create `keystore.properties` in the project root.

> **Never commit** the `.jks` file or `keystore.properties`. Back them up to a
> password manager — losing them means you can never update the app on Play.

## 7. Build the signed release AAB and APK

Always pass both `wrapperUrl` AND `revenueCatApiKey` when building. Without
the RevenueCat key, the app falls back to web payments — which Google Play
will reject for digital subscriptions.

```bash
# Signed AAB for Play Store upload
./gradlew bundleRelease \
  -PwrapperUrl=https://amynest.in \
  -PrevenueCatApiKey=goog_wswrltSsrqhqrsQrVvOPavTIzMA
# Output: app/build/outputs/bundle/release/app-release.aab

# Optional: signed APK for sideloading / testing
./gradlew assembleRelease \
  -PwrapperUrl=https://amynest.in \
  -PrevenueCatApiKey=goog_wswrltSsrqhqrsQrVvOPavTIzMA
# Output: app/build/outputs/apk/release/app-release.apk
```

> Tip: put both values in `~/.gradle/gradle.properties` so you don't have to
> retype them every build:
>
> ```properties
> wrapperUrl=https://amynest.in
> revenueCatApiKey=goog_wswrltSsrqhqrsQrVvOPavTIzMA
> ```

## 8. Upload to Play Console

1. Sign in to [Google Play Console](https://play.google.com/console).
2. Create the app (one-time): App name, default language, free/paid, declarations.
3. Set up the store listing using files in `store-assets/`:
   - App icon → `store-assets/icon-512.png` (you'll need to create this 512×512 PNG)
   - Feature graphic → `store-assets/feature-graphic-1024x500.png`
   - Phone screenshots → `store-assets/screenshots/` (at least 4, max 8, 1080×1920)
   - Short description → `store-assets/descriptions/short.txt`
   - Full description → `store-assets/descriptions/full.txt`
   - Privacy policy URL → host `store-assets/privacy-policy.md` somewhere public
4. **Production → Create new release** → upload `app-release.aab`.
5. Fill in release notes, rollout %, save, review, and submit for review.
6. For each subsequent update: bump `versionCode` + `versionName`, rebuild AAB,
   upload to a new release.

## 9. Google Play Billing setup (one-time)

The wrapper uses RevenueCat to handle Google Play Billing. The web paywall
inside the WebView automatically detects the bridge and replaces the
"Pay with UPI / Card" button with **Continue with Google Play** when running
inside the app.

### a) Google Play Console — create the subscription products

In the Play Console for this app: **Monetize → Subscriptions → Create
subscription**. Create three products with these exact IDs (they're already
hardcoded in the backend at `artifacts/api-server/src/routes/subscription.ts`,
function `productIdToPlan`):

| Plan       | Product ID         | Base plan ID  | Billing period |
| ---------- | ------------------ | ------------- | -------------- |
| Monthly    | `amynest_monthly`  | `monthly`     | P1M            |
| 6-month    | `amynest_6month`   | `six-month`   | P6M            |
| Yearly     | `amynest_yearly`   | `yearly`      | P1Y            |

For each product, set the price for India (INR) and any other launch markets,
then **activate** the base plan.

### b) RevenueCat dashboard — wire up the offering

1. Create a RevenueCat **project** if you haven't already, and add the
   `kidschedule-android` app under **Project settings → Apps → + Google Play**.
   Upload your Play Console service-account JSON so RevenueCat can verify
   purchases server-side.
2. **Products** → import the three Play subscriptions you created above.
3. **Entitlements** → create one called `premium` and attach all three
   products. (If you use a different name, set `REVENUECAT_ENTITLEMENT_ID`
   on the API server to match.)
4. **Offerings** → create a `default` offering with three packages whose
   identifiers exactly match the backend map:
   - `$rc_monthly`  → product `amynest_monthly`
   - `$rc_six_month` → product `amynest_6month`
   - `$rc_annual`  → product `amynest_yearly`
5. **API keys → Public Android SDK key (`goog_…`)** → use this as
   `revenueCatApiKey` when building the AAB.
6. **Project settings → Integrations → Webhooks** → add
   `https://<your-api>/api/subscription/webhook` with a bearer token; set
   the same token on the API server as `REVENUECAT_WEBHOOK_SECRET`.

### c) Test with the Play Internal Testing track

You **cannot** test Google Play Billing on a debug install — purchases need a
signed AAB on a Play track and a tester account.

1. Build a signed AAB (step 7 above) with `versionCode` higher than what's
   already on the track.
2. Play Console → **Testing → Internal testing → Create new release** →
   upload the AAB.
3. Add your Google account as a tester and accept the opt-in link.
4. Install from the Play Store on your phone, open the paywall, tap
   **Continue with Google Play** — Play will show a fake "test card" charge.
5. Check that your backend `subscriptions` row flips to `active` (the
   webhook does this automatically) and the paywall closes.

If purchases stay pending, check:
- RevenueCat dashboard → **Customers** → your Clerk user id should appear.
- API server logs for `/api/subscription/webhook` 200s.
- Play Console → **Monetize → Subscriptions** → the product is **active**
  and the test account is in the licence-tester list.

## 10. When the website changes

You **do not** need a new Play Store release for normal website updates — users
get them automatically because the app loads the live URL.

You only need to ship a new AAB when:
- The wrapper URL itself changes (different domain)
- You add a new permission, change the icon/splash, or update the wrapper code
- Google Play requires a target SDK bump (typically once a year)

## What's inside

```
kidschedule-android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml            # Permissions, launcher activity
│   │   ├── java/com/kidschedule/app/
│   │   │   ├── KidScheduleApp.kt          # Application + RevenueCat init
│   │   │   ├── BillingBridge.kt           # @JavascriptInterface for Play Billing
│   │   │   └── MainActivity.kt            # WebView host + offline screen
│   │   └── res/                           # Icons, themes, strings, layout
│   ├── build.gradle.kts                   # App module config + signing
│   └── proguard-rules.pro
├── scripts/generate-keystore.sh           # Keystore generation helper
├── store-assets/                          # Play Store listing assets
├── build.gradle.kts                       # Root Gradle config
├── settings.gradle.kts
└── README.md
```

## Features in the wrapper

- Full-screen WebView (no browser chrome)
- JavaScript, DOM storage, cookies, third-party cookies enabled
- Pull-to-refresh
- Hardware back button → WebView history (then exit)
- File uploads (e.g. `<input type="file">`)
- Camera / microphone / geolocation runtime permission prompts
- External links (`mailto:`, `tel:`, `intent://`, `market://`, off-domain `https://`) open in the system handler
- Offline detection with a "No internet — Retry" screen instead of a white page
- Adaptive launcher icon + splash screen using the brand colors
- WebView state preservation across rotation
- Release build with R8/ProGuard minification
- **Google Play Billing** for Premium subscriptions, exposed to the WebView
  via a `window.AmyNestBillingNative` JavaScript bridge (RevenueCat-backed,
  with the existing backend webhook as the source of truth)
