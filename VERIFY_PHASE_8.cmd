@echo off
setlocal

echo.
echo RoomCheck Phase 8 verification
echo ==============================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

findstr /C:"replaceImportedDocument" "src\features\import\services\timetableImportService.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 8 safe replacement service was not extracted.
  exit /b 1
)

findstr /C:"clearImportedDocuments" "src\features\import\services\timetableImportService.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 8 clear-all service was not extracted.
  exit /b 1
)

findstr /C:"deleteAllImportedDocuments" "src\database\repositories\importedDocumentRepository.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 8 database cleanup query was not extracted.
  exit /b 1
)

findstr /C:"Replace document" "src\components\ui\ImportedDocumentCard.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 8 replace-document control was not extracted.
  exit /b 1
)

findstr /C:"Clear all documents" "src\screens\ManageDocumentsScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 8 clear-all control was not extracted.
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
echo Phase 8 verification passed.
echo Start the app with: npx expo start -c
exit /b 0
