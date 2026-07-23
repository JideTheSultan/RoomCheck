@echo off
setlocal

echo.
echo RoomCheck Phase 4 verification
echo ==============================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

if not exist "src\features\import\services\spreadsheetTimetableParser.ts" (
  echo ERROR: The Phase 4 timetable parser was not extracted.
  exit /b 1
)

if not exist "src\features\import\services\spreadsheetProcessingService.ts" (
  echo ERROR: The Phase 4 processing service was not extracted.
  exit /b 1
)

findstr /C:"\"xlsx\"" "package.json" >nul
if errorlevel 1 (
  echo ERROR: The Phase 4 xlsx dependency is missing from package.json.
  exit /b 1
)

if not exist "node_modules\xlsx" (
  echo ERROR: The xlsx dependency is not installed.
  echo Run npm install, then run VERIFY_PHASE_4.cmd again.
  exit /b 1
)

echo Patch files and dependency found.
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
echo Phase 4 verification passed.
echo Start the app with: npx expo start -c
exit /b 0
