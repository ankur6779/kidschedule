# AmyNest AI — Android Internal Testing Build Guide

This document walks you through producing a Google Play **Internal Testing**
build for the AmyNest mobile app and uploading it to the Play Console.

App identifiers (already set in `artifacts/amynest-mobile/app.json`):

| Field           | Value                          |
| --------------- | ------------------------------ |
| App name        | AmyNest AI — Mobile App        |
| Slug            | amynest-mobile                 |
| Android package | `com.amynest.ai`               |
| Bundle id (iOS) | `com.amynest.ai`               |
| Version         | `1.0.0`                        |

---

## 1. One-time Google Play Console setup

1. Sign in to <https://play.google.com/console> with a Google Play developer
   account (one-time US$25 fee).
2. Click **Create app** and fill in:
   - App name: **AmyNest AI**
   - Default language: **English (United States)**
   - App type: **App**
   - Free or paid: **Free**
3. Complete the **Dashboard → Set up your app** checklist (privacy policy,
   data safety, content rating, target audience, ads declaration).
4. Go to **Monetize → Products → Subscriptions** and create three base plans
   matching the RevenueCat seed:

   | Product ID         | Base plan ID | Price            |
   | ------------------ | ------------ | ---------------- |
   | `amynest_monthly`  | `monthly`    | ₹199 / month     |
   | `amynest_6month`   | `6month`     | ₹999 / 6 months  |
   | `amynest_yearly`   | `yearly`     | ₹1599 / year     |

   These IDs must match what the RevenueCat seed (`scripts/seedRevenueCat.ts`)
   created — otherwise the webhook's `productIdToPlan()` won't recognise
   purchases.

5. Under **Testing → Internal testing**, click **Create new release**, then
   **Create email list** and add the tester Gmail addresses. Copy the
   opt-in link — testers must open it on their device once before they can
   install.

---

## 2. One-time RevenueCat ↔ Play Store linking

In the RevenueCat dashboard:

1. **Project settings → Apps → AmyNest (Google Play)** — paste the **Service
   account JSON** from Google Cloud (Play Console → Setup → API access →
   Create new service account, grant *Financial data* + *Manage orders*
   permissions).
2. **Project settings → Integrations → Webhooks** — add:
   - URL: `https://<your-api-domain>/api/subscription/webhook`
   - Authorization header: `Bearer <REVENUECAT_WEBHOOK_SECRET>`
3. Make sure the three Play products from §1.4 are mapped to the RC products
   `amynest_monthly`, `amynest_6month`, `amynest_yearly` (the seed already
   created the RC product IDs; you only need to attach the Play store
   identifiers).

---

## 3. Configure EAS (Expo Application Services)

From the workspace root:

```bash
# 3.1 Install EAS CLI globally if you don't have it
pnpm add -g eas-cli

# 3.2 Log into your Expo account
eas login

# 3.3 Initialise EAS for this project (run inside the mobile artifact)
cd artifacts/amynest-mobile
eas init      # creates the EAS project + writes the projectId into app.json
```

Create `artifacts/amynest-mobile/eas.json`:

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "internal": {
      "channel": "internal",
      "distribution": "internal",
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY": "goog_xxx_replace_me",
        "EXPO_PUBLIC_REVENUECAT_TEST_API_KEY": "test_xxx_replace_me"
      }
    },
    "production": {
      "channel": "production",
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "internal": {
      "android": {
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

Replace the `EXPO_PUBLIC_REVENUECAT_*` values with the keys shown in the
RevenueCat dashboard (**Project → API keys**). The `goog_…` key is the Play
Store-specific public SDK key.

> The mobile client picks the right key automatically (see
> `artifacts/amynest-mobile/lib/revenuecat.ts` → `pickApiKey()`): test key in
> Expo Go / dev, Android key on real Play builds.

---

## 4. Produce the .aab (Android App Bundle)

```bash
cd artifacts/amynest-mobile
eas build --profile internal --platform android
```

EAS will:

1. Prompt you to either generate a new Android upload keystore or upload an
   existing one. Let EAS manage it (recommended).
2. Run a cloud build and produce a signed `.aab` artifact. The CLI prints
   a download URL when it's done (build typically takes 8–15 minutes).

---

## 5. Upload to Play Internal Testing

You have two options:

### Option A — automatic via EAS (recommended)

```bash
eas submit --profile internal --platform android --latest
```

This uploads the most recent `.aab` to the Internal Testing track in draft
state. Open the Play Console, review, and click **Roll out to internal
testing**.

### Option B — manual

1. Download the `.aab` from the EAS build page.
2. Play Console → **Testing → Internal testing → Create new release →
   Upload** → drag the `.aab` in.
3. Fill in release notes and click **Save → Review release → Roll out**.

---

## 6. Tester onboarding

1. Send the **opt-in URL** from the Internal Testing page to your tester
   Gmail addresses.
2. They open the link on their Android device (signed in with the same
   Gmail), tap **Become a tester**, then tap **Download it on Google Play**.
3. They sign in to AmyNest with their Clerk account. RevenueCat purchases
   in this build are real charges against the tester's Google account, but
   you can configure them as **License testers** in Play Console (Setup →
   License testing) so test purchases are auto-refunded.

---

## 7. Required environment variables (production)

Set these in the Replit deployment for the API server before the testers
start hitting the webhook:

| Variable                              | Notes                                                 |
| ------------------------------------- | ----------------------------------------------------- |
| `REVENUECAT_PROJECT_ID`               | already set                                           |
| `REVENUECAT_GOOGLE_PLAY_STORE_APP_ID` | already set                                           |
| `REVENUECAT_ENTITLEMENT_ID`           | `premium` (already set)                               |
| `REVENUECAT_WEBHOOK_SECRET`           | **set this** — webhook 503s in production without it  |

For the mobile build, EAS injects the `EXPO_PUBLIC_REVENUECAT_*` keys at
build time from `eas.json` (no Replit env vars needed).

---

## 8. Iterating

For every code change you want testers to receive:

```bash
cd artifacts/amynest-mobile
# bump version in app.json (e.g. 1.0.0 -> 1.0.1) AND android.versionCode
eas build --profile internal --platform android
eas submit --profile internal --platform android --latest
```

Play Internal Testing distributes new builds to testers within minutes —
no review wait.

---

## Razorpay Setup (Android User Choice Billing + Web)

AmyNest offers Razorpay (UPI / Card / Netbanking) as a second payment
option alongside Google Play Billing on Android, and as the **only**
payment option on the website. iOS does not get Razorpay (Apple
forbids third-party billing for digital subscriptions).

### 1. Get Razorpay API keys

1. Sign up / log in at <https://dashboard.razorpay.com/>.
2. Switch to **Test Mode** for development (toggle top-right).
3. Go to **Account & Settings → API Keys → Generate Test Key**.
4. Copy the `Key ID` (starts with `rzp_test_…`) and `Key Secret`.
5. Add both to Replit Secrets:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
6. Mirror the **public** key as client-shipped env vars:
   - `VITE_RAZORPAY_KEY_ID` (web)
   - `EXPO_PUBLIC_RAZORPAY_KEY_ID` (mobile)

### 2. Seed the three subscription Plans

Once `RAZORPAY_KEY_ID` / `_SECRET` are set, run the seed script
to create the three subscription Plans (₹199 monthly, ₹999 6-month,
₹1599 yearly):

```bash
pnpm --filter @workspace/api-server exec tsx scripts/seedRazorpay.ts
```

Copy the printed `plan_xxx` IDs into Replit Secrets:

- `RAZORPAY_PLAN_ID_MONTHLY`
- `RAZORPAY_PLAN_ID_SIX_MONTH` *(canonical; also accepted as `RAZORPAY_PLAN_ID_QUARTERLY`)*
- `RAZORPAY_PLAN_ID_YEARLY`

### 3. Configure the webhook

1. In the Razorpay dashboard go to **Account & Settings → Webhooks → Add
   New Webhook**.
2. Webhook URL: `https://<your-deployed-domain>/api/subscription/razorpay/webhook`
3. Subscribe to events: `subscription.activated`, `subscription.charged`,
   `subscription.cancelled`, `subscription.completed`,
   `subscription.expired`, `subscription.paused`, `subscription.resumed`,
   `subscription.halted`, `subscription.authenticated`.
4. Set a **Secret** (any strong random string) and add it to Replit
   Secrets as `RAZORPAY_WEBHOOK_SECRET`. The server returns 503 in
   production if this secret is unset.

### 4. Google Play User Choice Billing (Android only)

Google requires opt-in to allow third-party billing alongside Play
Billing.

1. In Play Console → **Monetisation setup → Alternative billing →
   User choice billing**, apply for the program.
2. Once approved, the Razorpay-paid Android users get the Razorpay
   button on the paywall. Until approved, keep Razorpay disabled in
   the production Android build by leaving `EXPO_PUBLIC_RAZORPAY_KEY_ID`
   unset (the button gracefully shows a "not available" message).

### 5. Switch from Test mode to Live mode

1. In the Razorpay dashboard toggle to **Live Mode** and complete KYC.
2. Generate **Live API keys**, replace `RAZORPAY_KEY_ID` /
   `RAZORPAY_KEY_SECRET` (and the public key vars).
3. Re-run `seedRazorpay.ts` against live mode to create live Plans, then
   update the three `RAZORPAY_PLAN_ID_*` secrets.
4. Add a Live-mode webhook with the same URL and secret.

### 6. Smoke test

- Web: open the paywall, pick a plan, click **Pay with UPI / Card**.
  Use Razorpay test card `4111 1111 1111 1111`, any future expiry,
  CVV `123`, OTP `1111` to complete the mandate.
- After verify, the `subscriptions` row should flip to `active` with
  `provider="razorpay"`. The webhook then refines `current_period_end`.
- Android: build with `eas build --profile preview --platform android`
  (Expo Go cannot load `react-native-razorpay`'s native module).
