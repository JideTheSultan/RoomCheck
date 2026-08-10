@echo off
setlocal

echo.
echo RoomCheck Phase 10 verification
echo ===============================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

if not exist "src\screens\ImageTimetableEntryScreen.tsx" (
  echo ERROR: The Phase 10 image timetable screen was not extracted.
  exit /b 1
)

if not exist "src\features\import\services\manualImageTimetableService.ts" (
  echo ERROR: The Phase 10 manual timetable service was not extracted.
  exit /b 1
)

findstr /C:"Enter timetable rows" "src\screens\ImageTimetableEntryScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 10 timetable row form is missing.
  exit /b 1
)

findstr /C:"addManualImageTimetableEntry" "src\features\import\services\manualImageTimetableService.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 10 manual row save operation is missing.
  exit /b 1
)

findstr /C:"removeManualImageTimetableEntry" "src\features\import\services\manualImageTimetableService.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 10 manual row removal operation is missing.
  exit /b 1
)

findstr /C:"parseTimetableTimeInput" "src\utils\timetableDateTime.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 10 time validation helper is missing.
  exit /b 1
)

findstr /C:"ImageTimetableEntry" "src\navigation\RootNavigator.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 10 image timetable route is missing.
  exit /b 1
)

findstr /C:"onEnterRows" "src\components\ui\ImportedDocumentCard.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 10 image document action is missing.
  exit /b 1
)

echo Patch files found.
echo.
echo Running TypeScript check...
call npm run typecheck
if errorlevel 1 (
  echo ERROR: TypeScript verification failed.
  exit /b 1
)

echo.
echo Checking Expo dependency versions...
call npx expo install --check
if errorlevel 1 (
  echo ERROR: Expo dependency verification failed.
  exit /b 1
)

echo.
echo Running Expo Doctor...
call npx expo-doctor
if errorlevel 1 (
  echo ERROR: Expo Doctor found a problem.
  exit /b 1
)

echo.
echo Phase 10 verification passed.
echo Start the app with: npx expo start -c
exit /b 0
