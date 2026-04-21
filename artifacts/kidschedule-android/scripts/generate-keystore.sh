#!/usr/bin/env bash
# Generate a release keystore for signing the Play Store AAB.
# Run once, then keep the .jks file safe — losing it means you can never update the app on Play.
#
# Usage:
#   bash scripts/generate-keystore.sh
#
# After this finishes, edit ../keystore.properties (created next to settings.gradle.kts)
# with the values printed at the end. NEVER commit the .jks or keystore.properties.

set -euo pipefail

KEYSTORE_DIR="${KEYSTORE_DIR:-$HOME/.kidschedule-keystore}"
KEYSTORE_FILE="${KEYSTORE_FILE:-$KEYSTORE_DIR/kidschedule-release.jks}"
KEY_ALIAS="${KEY_ALIAS:-kidschedule}"
VALIDITY_DAYS="${VALIDITY_DAYS:-10000}"

mkdir -p "$KEYSTORE_DIR"

if [[ -f "$KEYSTORE_FILE" ]]; then
  echo "Keystore already exists at: $KEYSTORE_FILE"
  echo "Refusing to overwrite. Delete it first if you really want to regenerate."
  exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
  echo "ERROR: 'keytool' not found. Install a JDK 17 (e.g. Temurin or OpenJDK)."
  exit 1
fi

echo "Generating release keystore at: $KEYSTORE_FILE"
echo "You will be prompted for a store password, key password, and the distinguished name."
echo

keytool -genkeypair -v \
  -keystore "$KEYSTORE_FILE" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA -keysize 2048 \
  -validity "$VALIDITY_DAYS"

cat <<EOF

Done. Now create a file called 'keystore.properties' next to settings.gradle.kts
(in the project root), with these contents:

----- keystore.properties -----
storeFile=$KEYSTORE_FILE
storePassword=YOUR_STORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=YOUR_KEY_PASSWORD
-------------------------------

Then build the signed AAB with:
  ./gradlew bundleRelease -PwrapperUrl=https://your-deployed-site.example

The signed AAB will be at:
  app/build/outputs/bundle/release/app-release.aab

NEVER commit keystore.properties or the .jks file. Back them up somewhere safe
(password manager, encrypted drive). If you lose them, you can never publish
an update to this app on Google Play.
EOF
