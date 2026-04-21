# Play Store Assets

This folder ships with a complete set of **placeholder** assets at the exact
sizes Google Play requires, so the listing can be uploaded end-to-end for a
review/internal-testing track without blocking. Replace each placeholder with
a final, branded version before pushing to production.

Sizes are strictly enforced by Google.

| Asset | Required size | File path |
|---|---|---|
| App icon | 512 × 512 PNG (32-bit, with alpha) | `icon-512.png` |
| Feature graphic | 1024 × 500 PNG/JPG (no alpha) | `feature-graphic-1024x500.png` |
| Phone screenshots | 1080 × 1920 PNG/JPG, 4–8 images | `screenshots/01.png` … `08.png` |
| (Optional) 7" tablet screenshots | 1200 × 1920 PNG/JPG | `screenshots-tablet/` |
| Short description (≤ 80 chars) | text | `descriptions/short.txt` |
| Full description (≤ 4000 chars) | text | `descriptions/full.txt` |
| Privacy policy | publicly hosted HTML/MD URL | `privacy-policy.md` (host this somewhere) |

## Quick way to capture screenshots

1. Run the app on an emulator (Pixel 6, API 34) at 1080 × 1920.
2. Navigate to a key screen (Home, Routine Builder, Today's Plan, Reward
   History, Settings, Paywall).
3. Use Android Studio's **Logcat → Camera icon** to save a screenshot, or
   `adb shell screencap -p /sdcard/01.png && adb pull /sdcard/01.png`.
4. Drop them into `screenshots/`.

## Quick way to make the icon and feature graphic

The in-app launcher icon is drawn from `app/src/main/res/drawable/ic_launcher_foreground.xml`
on the brand color background. For the **store** icon, export a 512×512 PNG of
the same logo from any vector tool (Figma, Inkscape, Illustrator).

Feature graphic should be a 1024×500 banner showing the app name + tagline +
a clean device mockup of the home screen.
