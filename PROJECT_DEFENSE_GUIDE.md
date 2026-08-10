# RoomCheck Project Defense Guide

## One-sentence explanation

RoomCheck converts university timetable documents into searchable local data
so students can check which classrooms are scheduled to be free and whether a
class group has a course at a selected time.

## Problem being solved

University timetables are usually distributed as spreadsheets or images.
Students must manually scan large tables to find a free room or confirm a class
schedule. This is slow and easy to get wrong.

## Proposed solution

RoomCheck imports timetable documents, converts them into structured SQLite
records and performs time-overlap queries. It gives clear results without
requiring an internet connection or central school server.

## Recommended demonstration order

1. Show the fresh import screen.
2. Import the full feature-test XLSX workbook.
3. Show the discovered document, classroom and timetable-entry totals.
4. Find a free classroom for a chosen weekday and period.
5. Check the ISMS 300 schedule for a known time.
6. Import an image and enter one timetable row manually.
7. Replace or remove one document and show that unrelated data remains.
8. Export a backup, clear the data, then restore the backup.
9. Open About and Privacy to explain local storage and limitations.

## Main technologies to explain

- Expo SDK 54 provides the React Native runtime and Expo Go compatibility.
- TypeScript reduces invalid data and navigation mistakes during development.
- Expo SQLite stores structured documents, classrooms and timetable rows.
- SheetJS reads XLSX and CSV content locally.
- React Navigation controls typed movement between screens.
- Zustand holds the small app-wide database summary.
- SQL overlap conditions provide correct time-based searches.

## Likely questions and answers

### How does RoomCheck decide that a room is free?

It removes any classroom with a timetable entry where the class starts before
the requested end and ends after the requested start. This detects every real
overlap while allowing one class to end exactly when another period starts.

### Does RoomCheck detect people physically inside the room?

No. It reports scheduled availability from the imported timetable. The app
states this limitation on Home and result screens.

### Why use SQLite?

SQLite supports reliable local storage, relationships, indexes and fast
time-overlap queries without requiring internet access.

### How is data protected when a document is replaced?

The new spreadsheet is imported and processed first. The original document is
removed only after the replacement succeeds.

### Why is image OCR manual?

Reliable on-device OCR needs native modules that Expo Go does not include.
Putting a cloud OCR key inside the app would be insecure, so RoomCheck provides
a local manual-entry workflow.

### What happens if restore fails halfway?

Restore runs inside one exclusive SQLite transaction. Any failed write rolls
back the complete operation and preserves the previous database.

### What would you add in a future version?

A secure institutional backend could provide authenticated timetable updates,
cloud OCR and multi-device synchronization. Those features would require a new
privacy and security design.

## Final defense warning

Do not claim that RoomCheck detects real occupancy or supports every timetable
layout. State the limitation clearly, then explain why the local parser,
manual-image workflow and structured validation are dependable within the
supported formats.

