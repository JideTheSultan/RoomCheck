@echo off
setlocal

echo.
echo RoomCheck Phase 11 verification
echo ===============================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

if not exist "src\screens\DataBackupScreen.tsx" (
  echo ERROR: The Phase 11 backup screen was not extracted.
  exit /b 1
)

if not exist "src\features\backup\services\roomCheckBackupService.ts" (
  echo ERROR: The Phase 11 backup service was not extracted.
  exit /b 1
)

findstr /C:"expo-sharing" "package.json" >nul
if errorlevel 1 (
  echo ERROR: The Phase 11 sharing dependency is missing.
  exit /b 1
)

findstr /C:"createRoomCheckBackup" "src\features\backup\services\roomCheckBackupService.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 11 backup export operation is missing.
  exit /b 1
)

findstr /C:"parseRoomCheckBackup" "src\features\backup\services\roomCheckBackupService.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 11 backup validation operation is missing.
  exit /b 1
)

findstr /C:"withExclusiveTransactionAsync" "src\features\backup\services\roomCheckBackupService.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 11 transactional restore operation is missing.
  exit /b 1
)

findstr /C:"Replace current RoomCheck data?" "src\screens\DataBackupScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 11 restore confirmation is missing.
  exit /b 1
)

findstr /C:"DataBackup" "src\navigation\RootNavigator.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 11 backup route is missing.
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
echo Phase 11 verification passed.
echo Start the app with: npx expo start -c
exit /b 0
