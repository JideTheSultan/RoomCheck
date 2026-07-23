# Phase 2 handoff

## Completed

- Added the versioned local SQLite database
- Enabled foreign keys and write-ahead logging
- Added imported-document storage for XLSX, CSV and image sources
- Added processing states: pending, processing, ready and failed
- Added classroom and classroom-alias storage
- Added timetable-entry storage with weekday and time validation
- Added indexes for future classroom and class-group searches
- Added typed repositories for documents, rooms and timetable entries
- Connected database summaries to the Home and Manage Documents screens
- Added a safe startup error screen for database failures

## Supported source types prepared by the database

- `.xlsx`
- `.csv`
- timetable images, including PNG, JPEG, WebP and common phone-image formats

Phase 2 records these file types but does not select or parse them yet.

## Important image rule

An image must first be converted into timetable text and structured rows before
RoomCheck can answer availability questions. The database now has fields for
the extracted text and processing result. The extraction method will be chosen
in the import-processing phase while preserving Expo Go compatibility.

## Intentionally not implemented yet

- File selection
- XLSX parsing
- CSV parsing
- Image text extraction
- Classroom discovery from imported content
- Free-room queries
- Department and level queries

## Validate

```text
npm install
npm run typecheck
npx expo-doctor
npx expo start -c
```
