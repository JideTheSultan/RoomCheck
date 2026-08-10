@echo off
setlocal

echo.
echo RoomCheck Phase 9 verification
echo ==============================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

if not exist "src\components\AppErrorBoundary.tsx" (
  echo ERROR: The Phase 9 app error boundary was not extracted.
  exit /b 1
)

findstr /C:"Something went wrong" "src\components\AppErrorBoundary.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 9 unexpected-error recovery screen is missing.
  exit /b 1
)

findstr /C:"Try opening the database again" "src\components\DatabaseFailureScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 9 database retry control is missing.
  exit /b 1
)

findstr /C:"No new files imported" "src\components\ui\ImportResultCard.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 9 import-result feedback was not extracted.
  exit /b 1
)

findstr /C:"Manage timetable documents" "src\screens\FindFreeClassroomScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The free-classroom recovery action is missing.
  exit /b 1
)

findstr /C:"Manage timetable documents" "src\screens\CheckDepartmentLevelScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The class-group recovery action is missing.
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
echo Phase 9 verification passed.
echo Start the app with: npx expo start -c
exit /b 0
