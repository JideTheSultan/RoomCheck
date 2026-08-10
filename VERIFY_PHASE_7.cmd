@echo off
setlocal

echo.
echo RoomCheck Phase 7 verification
echo ==============================

if not exist "package.json" (
  echo ERROR: package.json was not found.
  echo Run this file from the RoomCheck project folder.
  exit /b 1
)

if not exist "src\database\repositories\classGroupRepository.ts" (
  echo ERROR: The Phase 7 class-group query was not extracted.
  exit /b 1
)

findstr /C:"listClassGroupOptions" "src\database\repositories\classGroupRepository.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 7 department and level options query is missing.
  exit /b 1
)

findstr /C:"Check this group now" "src\screens\CheckDepartmentLevelScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 7 class-group search form was not extracted.
  exit /b 1
)

findstr /C:"No scheduled class" "src\screens\SearchResultsScreen.tsx" >nul
if errorlevel 1 (
  echo ERROR: The Phase 7 class-group result states were not extracted.
  exit /b 1
)

findstr /C:"kind: 'class-group'" "src\navigation\navigationTypes.ts" >nul
if errorlevel 1 (
  echo ERROR: The Phase 7 navigation contract was not extracted.
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
echo Phase 7 verification passed.
echo Start the app with: npx expo start -c
exit /b 0
