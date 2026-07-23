# RoomCheck

RoomCheck is a simple Expo mobile app for checking scheduled classroom
availability from imported university timetable documents.

## Current checkpoint

Phase 2 contains the project foundation and local data layer:

- Expo SDK 54 and TypeScript
- Expo Go compatibility
- React Navigation
- Shared theme and reusable interface components
- Zustand app state
- Placeholder screens for every agreed workflow
- Versioned Expo SQLite database initialization
- Typed models and repositories for timetable data
- XLSX, CSV and image source types
- Imported-document, classroom, alias and timetable-entry tables

File selection, file parsing and availability queries are intentionally
reserved for later phases.

## Run the project

```bash
npm install
npx expo start -c
```

Open the QR code using Expo Go.

## Validation

```bash
npm run typecheck
npx expo-doctor
```
