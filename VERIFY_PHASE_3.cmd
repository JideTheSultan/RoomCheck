@echo off
setlocal

echo.
echo RoomCheck Phase 3 verification
echo ==============================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

if not exist "src\features\import\services\timetableImportService.ts" (
  echo ERROR: Phase 3 import service was not extracted.
  exit /b 1
)

if not exist "src\components\ui\ImportedDocumentCard.tsx" (
  echo ERROR: Phase 3 document card was not extracted.
  exit /b 1
)

if not exist "src\hooks\useImportedDocuments.ts" (
  echo ERROR: Phase 3 document hook was not extracted.
  exit /b 1
)

findstr /C:"#2563EB" "src\theme\colors.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 3 blue accent was not applied.
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
echo Phase 3 verification passed.
echo Start the app with: npx expo start -c
exit /b 0
