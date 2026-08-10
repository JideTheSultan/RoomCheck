@echo off
setlocal

echo.
echo RoomCheck Phase 12 final verification
echo =====================================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

if not exist "assets\icon.png" (
  echo ERROR: The final RoomCheck app icon is missing.
  exit /b 1
)

if not exist "assets\adaptive-icon.png" (
  echo ERROR: The Android adaptive icon is missing.
  exit /b 1
)

if not exist "assets\splash-icon.png" (
  echo ERROR: The RoomCheck splash image is missing.
  exit /b 1
)

if not exist "eas.json" (
  echo ERROR: The EAS build configuration is missing.
  exit /b 1
)

if not exist "PRIVACY_POLICY.md" (
  echo ERROR: The final privacy policy is missing.
  exit /b 1
)

if not exist "FINAL_TEST_CHECKLIST.md" (
  echo ERROR: The final regression checklist is missing.
  exit /b 1
)

if not exist "PROJECT_DEFENSE_GUIDE.md" (
  echo ERROR: The project-defense guide is missing.
  exit /b 1
)

findstr /C:"adaptiveIcon" "app.json" >nul
if errorlevel 1 (
  echo ERROR: The Android adaptive icon configuration is missing.
  exit /b 1
)

findstr /C:"RoomCheck" "README.md" >nul
if errorlevel 1 (
  echo ERROR: The final README was not extracted.
  exit /b 1
)

findstr /C:"AboutScreen" "src\navigation\RootNavigator.tsx" >nul
if errorlevel 1 (
  echo ERROR: The About and Privacy screen route is missing.
  exit /b 1
)

findstr /C:"buildType" "eas.json" >nul
if errorlevel 1 (
  echo ERROR: The EAS preview APK configuration is missing.
  exit /b 1
)

echo Patch files found.
echo.
echo Checking Expo app configuration...
call npx expo config --type public >nul
if errorlevel 1 (
  echo ERROR: Expo app configuration is invalid.
  exit /b 1
)

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
echo Phase 12 verification passed.
echo Start the app with: npx expo start -c
echo Then complete: FINAL_TEST_CHECKLIST.md
exit /b 0
