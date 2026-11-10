# iOS → TestFlight pipeline

`.github/workflows/ios-testflight.yml` builds the app on a GitHub macOS runner with
fastlane (`ios/fastlane/Fastfile`, lane `beta`) and uploads it to TestFlight.

**When it runs:** every push to the `deployment` branch, or by hand:
GitHub → Actions → *iOS TestFlight* → *Run workflow*.

The build number is set automatically (latest TestFlight build + 1). The app version
(`MARKETING_VERSION`, now 1.0) is still changed in Xcode when you release a new version.

## One-time setup: repo secrets

GitHub → repo **Settings → Secrets and variables → Actions → New repository secret**.
To get base64 on a Mac: `base64 -i <file> | pbcopy` (then paste as the secret value).

| Secret | What it is | Where to get it |
|---|---|---|
| `APPLE_TEAM_ID` | 10-character team id | developer.apple.com → Account → Membership details |
| `ASC_KEY_ID` | App Store Connect API key id | App Store Connect → Users and Access → Integrations → App Store Connect API → generate a key with **App Manager** access |
| `ASC_ISSUER_ID` | Issuer id (UUID) | same page, above the key list |
| `ASC_KEY_P8_BASE64` | the downloaded `AuthKey_XXXX.p8`, base64 | downloaded once when the key is created |
| `IOS_DIST_CERT_P12_BASE64` | **Apple Distribution** certificate + private key, exported as `.p12`, base64 | Keychain Access on the Mac that created it → My Certificates → right-click → Export |
| `IOS_DIST_CERT_PASSWORD` | the password chosen when exporting the `.p12` | — |
| `IOS_PROVISIONING_PROFILE_BASE64` | **App Store** provisioning profile for `com.rmta`, base64 | developer.apple.com → Certificates, IDs & Profiles → Profiles → `+` → App Store Connect → `com.rmta` → the distribution certificate above |

The app `com.rmta` must already exist in App Store Connect (My Apps → `+` → New App).

## Checking a run

Actions → *iOS TestFlight* → the run. If it fails, the step log shows why and the
`ios-build` artifact has the full Xcode log. A successful upload appears in
App Store Connect → TestFlight after Apple processes it (usually 10–30 min).
