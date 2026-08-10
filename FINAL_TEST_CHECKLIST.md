# RoomCheck Final Test Checklist

Test the release candidate on at least one Android device and one iPhone using
Expo Go. Repeat the smoke tests on the preview APK before production release.

## 1. Fresh installation

- [ ] Run `npm install` successfully.
- [ ] Run `npm run typecheck` successfully.
- [ ] Run `npx expo install --check` successfully.
- [ ] Run `npx expo-doctor` successfully.
- [ ] Start with `npx expo start -c`.
- [ ] Confirm the app opens without a blank or crash screen.
- [ ] Confirm a new installation goes directly to timetable import.
- [ ] Confirm the RoomCheck icon and blue splash screen appear in a native
      preview build.

## 2. Spreadsheet importing

- [ ] Import one valid XLSX timetable.
- [ ] Confirm the document becomes Ready.
- [ ] Confirm the correct timetable-row count is shown.
- [ ] Confirm classroom, document and timetable-entry totals update.
- [ ] Import one valid CSV timetable.
- [ ] Select several supported files together.
- [ ] Select an unsupported file and confirm it is reported clearly.
- [ ] Import the same file twice and confirm the duplicate is skipped.
- [ ] Import an empty or unreadable spreadsheet and confirm the original error
      is shown without crashing the app.
- [ ] Retry a failed spreadsheet.

## 3. Free-classroom search

- [ ] Select Check Now and confirm a result screen appears.
- [ ] Choose Monday through Friday successfully.
- [ ] Choose each available timetable period successfully.
- [ ] Confirm a classroom with any overlapping class is not listed as free.
- [ ] Confirm a class ending exactly at the search start time does not block
      the classroom.
- [ ] Confirm the zero-results message appears when every room is occupied.
- [ ] Confirm the scheduled-versus-physical-occupancy warning remains visible.

## 4. Department and level search

- [ ] Confirm imported departments are listed.
- [ ] Confirm only levels available for the selected department are listed.
- [ ] Check the selected group for the current hour.
- [ ] Check the selected group for a chosen weekday and period.
- [ ] Confirm course code, optional title, classroom and actual class time.
- [ ] Confirm the no-scheduled-class state for a free group.
- [ ] Confirm missing department, level or period data provides a route to
      Timetable Documents.

## 5. Timetable image workflow

- [ ] Import PNG or JPEG timetable image.
- [ ] Open Enter Timetable Rows from the image document.
- [ ] Confirm the image preview loads.
- [ ] Save a row using a 12-hour time such as `8:30 AM`.
- [ ] Save a row using a 24-hour time such as `14:30`.
- [ ] Confirm required fields reject empty values.
- [ ] Confirm an end time earlier than the start time is rejected.
- [ ] Confirm saved image rows appear in both search features.
- [ ] Remove one image row after confirmation.
- [ ] Remove the last image row and confirm the document returns to Pending.

## 6. Document management

- [ ] Add another document without removing existing data.
- [ ] Replace a document with a valid spreadsheet.
- [ ] Confirm the original remains active when replacement processing fails.
- [ ] Remove one document after confirmation.
- [ ] Confirm other documents and shared classrooms remain intact.
- [ ] Clear all documents after confirmation.
- [ ] Confirm manually managed data is not removed unexpectedly.
- [ ] Confirm destructive controls cannot be pressed repeatedly while busy.

## 7. Backup and restore

- [ ] Export a RoomCheck JSON backup.
- [ ] Confirm the device share sheet opens.
- [ ] Save the backup somewhere private.
- [ ] Confirm the backup totals match the app totals.
- [ ] Attempt to restore an unrelated JSON file and confirm it is rejected.
- [ ] Attempt to restore an invalid text file and confirm it is rejected.
- [ ] Select a valid backup and confirm its date and totals appear before any
      data is changed.
- [ ] Cancel restore and confirm current data remains unchanged.
- [ ] Confirm restore and verify all structured timetable data returns.
- [ ] Confirm both search features work after restoration.

## 8. Recovery and empty states

- [ ] Confirm loading indicators appear during database and file operations.
- [ ] Confirm action buttons are disabled while an operation is running.
- [ ] Confirm database-load errors provide Try Again.
- [ ] Confirm screen-query errors provide Try Again.
- [ ] Confirm an unexpected render error shows the recovery screen without
      deleting timetable files.
- [ ] Confirm empty document and empty search states provide a useful next
      action.

## 9. Release interface

- [ ] Open About and Privacy from Home.
- [ ] Confirm Version 1.0.0 is displayed.
- [ ] Confirm privacy and limitation statements are accurate.
- [ ] Check every screen on a small phone for clipped or overlapping text.
- [ ] Check every screen on a large phone.
- [ ] Check Android back navigation.
- [ ] Check iOS back navigation.
- [ ] Confirm no debug messages, secrets or API keys appear in the interface.

## Final sign-off

- [ ] Every blocker is fixed or documented.
- [ ] A fresh preview APK passes the complete smoke test.
- [ ] The final Git commit and version tag are created.
- [ ] The privacy policy is hosted at a public HTTPS URL before store
      submission.

