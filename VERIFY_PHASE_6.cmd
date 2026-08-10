@echo off
setlocal

echo.
echo RoomCheck Phase 6 verification
echo ==============================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

if not exist "src\database\repositories\availabilityRepository.ts" (
  echo ERROR: The Phase 6 availability query was not extracted.
  exit /b 1
)

if not exist "src\utils\timetableDateTime.ts" (
  echo ERROR: The Phase 6 timetable time utilities were not extracted.
  exit /b 1
)

findstr /C:"Find free classrooms" "src\screens\FindFreeClassroomScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 6 free-classroom form was not extracted.
  exit /b 1
)

findstr /C:"Scheduled free for this full period" "src\screens\SearchResultsScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 6 result list was not extracted.
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
echo Phase 6 verification passed.
echo Start the app with: npx expo start -c
exit /b 0
