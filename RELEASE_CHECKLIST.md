# RoomCheck Release Checklist

The source code is release-ready, but app-store publication still requires the
developer’s Expo, Google Play and Apple credentials. Those private account
steps cannot be completed inside the project patch.

## 1. Confirm identifiers

- App name: `RoomCheck`
- App version: `1.0.0`
- Expo slug: `roomcheck`
- Android package: `com.banchero.roomcheck`
- iOS bundle identifier: `com.banchero.roomcheck`

Package and bundle identifiers should not be changed after a store release
unless a completely separate app listing is intended.

## 2. Link the Expo project

Run:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

Confirm that Expo adds the correct project ID to `app.json`, then commit that
account-specific configuration.

## 3. Create an internal Android APK

```bash
npx eas-cli@latest build --platform android --profile preview
```

Install the APK on a real Android phone and complete the smoke-test sections in
`FINAL_TEST_CHECKLIST.md`.

## 4. Create production builds

Android App Bundle:

```bash
npx eas-cli@latest build --platform android --profile production
```

iOS archive:

```bash
npx eas-cli@latest build --platform ios --profile production
```

EAS will request signing configuration. Keep keystores, certificates, account
passwords and recovery codes out of Git.

## 5. Prepare store content

- App name and short description
- Full description
- RoomCheck icon
- Phone screenshots from the release build
- Feature graphic for Google Play
- Category: Education or Productivity
- Support contact
- Public privacy-policy HTTPS URL
- Accurate age rating
- Accurate data-safety and app-privacy answers

Suggested short description:

> Check scheduled classroom availability from your university timetable.

## 6. Privacy declarations

Review `PRIVACY_POLICY.md` against the final binary. If analytics, cloud OCR,
accounts, crash reporting or cloud sync are added later, update the policy and
store declarations before release.

The current RoomCheck release:

- has no user account;
- has no advertising;
- has no behavioral analytics;
- does not request location;
- stores timetable data locally; and
- shares a backup only after a user action.

## 7. Submission

After creating the store listings and production builds, submission can be
started with:

```bash
npx eas-cli@latest submit --platform android
npx eas-cli@latest submit --platform ios
```

Submission does not guarantee approval. Respond to store-review questions with
the scheduled-versus-live occupancy limitation and local-data behavior stated
in the app and privacy policy.

## 8. Final Git release

```bash
git add .
git commit -m "Complete RoomCheck Phase 12 release candidate"
git tag -a v1.0.0 -m "RoomCheck 1.0.0 release candidate"
git push
git push origin v1.0.0
```

Create the tag only after the final device checklist passes.

