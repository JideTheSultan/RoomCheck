@echo off
setlocal

echo.
echo RoomCheck Phase 5 verification
echo ==============================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

findstr /C:"TIMETABLE READY" "src\screens\HomeScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 5 Home dashboard was not extracted.
  exit /b 1
)

findstr /C:"hasLoadedDatabaseSummary" "src\store\useAppStore.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 5 startup state was not extracted.
  exit /b 1
)

findstr /C:"Continue to Home" "src\screens\ImportTimetablesScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 5 import-to-Home flow was not extracted.
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
echo Phase 5 verification passed.
echo Start the app with: npx expo start -c
exit /b 0
