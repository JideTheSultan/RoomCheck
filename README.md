# RoomCheck

RoomCheck is an Expo mobile app for checking scheduled classroom availability
from imported university timetable documents. Version 1.0.0 is the final
Phase 12 release candidate.

## Main features

- Import one or several XLSX, CSV or timetable image files.
- Parse row-based spreadsheets and the supported school timetable grid.
- Discover classrooms, departments, levels, weekdays and timetable periods.
- Find classrooms scheduled to remain free now or during a selected period.
- Check a department-and-level class schedule now or later.
- Add timetable rows manually from an imported timetable image.
- Replace or remove one document without damaging data from other documents.
- Clear all imported timetable data after confirmation.
- Export and restore versioned RoomCheck JSON backups.
- Recover from database, loading, import and unexpected screen errors.

## Accuracy rule

RoomCheck reports scheduled availability from imported data. It does not detect
whether somebody is physically inside a classroom.

## Supported files

- `.xlsx`
- `.csv`
- `.png`
- `.jpg` and `.jpeg`
- `.webp`
- `.heic` and `.heif`

XLSX and CSV files are processed automatically. Image timetable rows are
entered manually because reliable on-device OCR is not available in Expo Go.

## Technology

- Expo SDK 54 and React Native
- TypeScript strict mode
- Expo SQLite
- React Navigation
- Zustand
- SheetJS (`xlsx`)
- Expo File System, Document Picker and Sharing

All timetable processing and searches run locally on the device.

## Install and run

```bash
npm install
npx expo start -c
```

Scan the QR code with Expo Go.

## Validate

```bash
npm run typecheck
npx expo install --check
npx expo-doctor
```

Then complete every case in `FINAL_TEST_CHECKLIST.md` on Android and iOS.

## Preview Android build

Link the project to an Expo account once, then start the internal APK build:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

The Expo account owner must complete signing and project-linking prompts.

## Production builds

```bash
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
```

Production store submission requires Google Play and Apple developer accounts,
store listing content, screenshots, a public privacy-policy URL and completed
store privacy declarations. See `RELEASE_CHECKLIST.md`.

## Privacy

RoomCheck does not provide accounts, advertising or analytics. Imported files
and structured timetable data remain on the device unless the user deliberately
shares a backup. See `PRIVACY_POLICY.md` for the complete release policy.

## Project structure

```text
src/components       Reusable interface components
src/database         SQLite initialization, schema and repositories
src/features         Import, parsing, backup and restore services
src/hooks            Shared database-loading hooks
src/navigation       Typed application navigation
src/screens          RoomCheck screens
src/store            Shared application state
src/theme            Colours, spacing, typography and navigation theme
src/types            Shared TypeScript models
src/utils            Time, normalization and identifier helpers
```

## Final documentation

- `FINAL_HANDOFF.md` — completed scope and known limitations
- `FINAL_TEST_CHECKLIST.md` — manual regression tests
- `PRIVACY_POLICY.md` — privacy and local-data behavior
- `RELEASE_CHECKLIST.md` — EAS and app-store preparation
