# RoomCheck Final Handoff

## Release status

RoomCheck Phase 12 is the Version 1.0.0 release candidate. The planned local
app is complete and remains compatible with Expo Go on SDK 54.

## Completed workflow

1. A user imports XLSX, CSV or timetable image documents.
2. Spreadsheets are parsed locally; image rows can be entered manually.
3. Structured classes and classrooms are stored in Expo SQLite.
4. The user checks scheduled free classrooms or a class-group schedule.
5. Documents can be added, replaced, removed or cleared safely.
6. Structured timetable data can be exported and restored through a versioned
   JSON backup.

## Architecture

- React Native screens contain user interaction and navigation.
- Service modules own parsing, importing, manual image rows, backup and
  restoration.
- Typed repositories own SQLite queries.
- SQLite foreign keys and transactions protect document relationships.
- Zustand stores the small database summary used by Home and management
  screens.
- Shared theme and interface components keep states and actions consistent.

## Core correctness rules

- A classroom is free only when no timetable entry overlaps the complete
  requested period.
- A class ending exactly when a requested period begins does not block the
  room.
- Removing one document removes only entries created from that document.
- A shared classroom remains while another document still uses it.
- A replacement spreadsheet is processed before the original is removed.
- Restore replaces data only after validation, user confirmation and a
  successful exclusive database transaction.

## Known limitations

- Availability is scheduled, not live physical occupancy.
- Automatic image OCR is not included because Expo Go cannot run the required
  native OCR modules and secure cloud OCR needs an external backend.
- Backups contain structured timetable data, not original source-file bytes.
- RoomCheck does not synchronize data between devices automatically.
- The timetable parser cannot guarantee support for every institution’s custom
  spreadsheet design.

## Validation completed during development

- TypeScript strict checking
- Expo SDK dependency checks
- Expo Doctor checks
- Android and iOS Metro production exports
- Spreadsheet parsing checks
- Search-query boundary and overlap checks
- Document-isolation and shared-classroom checks
- Manual image-row database checks
- Backup validation, restoration and rollback checks
- Clean cumulative Phase 2 through Phase 12 upgrade testing

## Actions requiring the developer’s accounts

- Link the source to an Expo/EAS project.
- Create Android and iOS signing credentials.
- Run preview builds on real devices.
- Host the privacy policy publicly.
- Create Google Play and Apple App Store listings.
- Submit the signed builds for review.

Follow `FINAL_TEST_CHECKLIST.md` and `RELEASE_CHECKLIST.md` for those steps.

