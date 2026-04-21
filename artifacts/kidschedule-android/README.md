# KidSchedule — Android Wrapper

A minimal Android app that wraps the live KidSchedule website inside a full-screen
WebView, ready to be packaged as a signed AAB for Google Play.

This is intentionally a thin shell: no native features, no offline data, no
in-app purchases. The website is the source of truth — when you ship a website
update, users see it on next app open without needing a Play Store update.

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

```bash
# Signed AAB for Play Store upload
./gradlew bundleRelease -PwrapperUrl=https://kidschedule.example.com
# Output: app/build/outputs/bundle/release/app-release.aab

# Optional: signed APK for sideloading / testing
./gradlew assembleRelease -PwrapperUrl=https://kidschedule.example.com
# Output: app/build/outputs/apk/release/app-release.apk
```

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

## 9. When the website changes

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
│   │   │   ├── KidScheduleApp.kt          # Application class
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
