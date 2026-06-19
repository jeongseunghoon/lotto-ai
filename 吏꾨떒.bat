@echo off
title Lotto AI - Environment Check
cd /d "%~dp0"

echo.
echo ============================================
echo   Environment Diagnostic  [Mr. Robot]
echo ============================================
echo.

echo [Java]
if defined JAVA_HOME (
    echo   JAVA_HOME = %JAVA_HOME%
    if exist "%JAVA_HOME%\bin\java.exe" (echo   java.exe: FOUND) else (echo   java.exe: NOT FOUND - wrong path)
) else (
    echo   JAVA_HOME: NOT SET
)
where java >nul 2>&1 && echo   PATH java: OK || echo   PATH java: NOT FOUND

echo.
echo [Node.js / npm]
where node >nul 2>&1 && (for /f %%V in ('node --version') do echo   node: %%V) || echo   node: NOT FOUND
where npm  >nul 2>&1 && (for /f %%V in ('npm  --version') do echo   npm : v%%V) || echo   npm: NOT FOUND

echo.
echo [Project Files]
if exist "package.json"             (echo   package.json     : OK) else (echo   package.json     : MISSING)
if exist "node_modules"             (echo   node_modules     : OK) else (echo   node_modules     : MISSING - run npm install)
if exist "android\gradlew.bat"      (echo   android\gradlew  : OK) else (echo   android\gradlew  : MISSING)
if exist "android\local.properties" (
    echo   local.properties : OK
    type android\local.properties
) else (
    echo   local.properties : MISSING - run GRADLE_FIX.bat
)

echo.
echo [Android SDK]
if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    echo   SDK: FOUND at %LOCALAPPDATA%\Android\Sdk
) else (
    echo   SDK: NOT FOUND - install Android Studio
)

echo.
echo [build_log.txt]
if exist "build_log.txt" (
    echo   Last 25 lines:
    echo   ------------------------------------------
    powershell -Command "Get-Content 'build_log.txt' | Select-Object -Last 25"
    echo   ------------------------------------------
) else (
    echo   No log yet. Run BUILD_APK.bat first.
)

echo.
pause
