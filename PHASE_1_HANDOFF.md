# Phase 1 handoff

## Completed

- Expo SDK 54 project with TypeScript strict mode
- Expo Go-compatible package set
- React Navigation native stack
- Shared colour, spacing, typography and radius tokens
- Reusable screen, button, card and phase-notice components
- Zustand application state foundation
- Home screen and every agreed navigation route
- Placeholder screens for timetable importing and both searches
- iOS and Android Metro bundle verification

## Intentionally not implemented yet

- Excel file selection
- Excel workbook parsing
- SQLite database tables
- Imported-document persistence
- Classroom discovery
- Free-classroom queries
- Department and level queries

These belong to later phases and are not partially implemented in this
checkpoint.

## Install and run on Windows CMD

Run each command on one line:

```text
npm install
npx expo start -c
```

Scan the QR code using Expo Go.

## Validate

```text
npm run typecheck
npx expo-doctor
```

## Phase 2 target

Phase 2 will create the local SQLite data model for:

- imported documents
- timetable entries
- discovered classrooms

It will also add the database initialization and typed data-access services.
