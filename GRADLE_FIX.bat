@echo off
title Gradle Fix
cd /d "%~dp0"

echo.
echo ============================================
echo   Gradle Compatibility Fix  [Mr. Robot]
echo ============================================
echo.

:: ---- SDK AUTO DETECT + local.properties ----
echo [1/3] Detecting Android SDK...
set "SDK_DIR="

if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    set "SDK_DIR=%LOCALAPPDATA%\Android\Sdk"
)
if not defined SDK_DIR (
    if exist "%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools\adb.exe" (
        set "SDK_DIR=%USERPROFILE%\AppData\Local\Android\Sdk"
    )
)
if not defined SDK_DIR (
    if exist "C:\Android\Sdk\platform-tools\adb.exe" (
        set "SDK_DIR=C:\Android\Sdk"
    )
)

if defined SDK_DIR (
    powershell -Command "$p = '%SDK_DIR%' -replace '\\\\','\\\\'; Set-Content 'android\local.properties' \"sdk.dir=$p\""
    echo SDK found: %SDK_DIR%
    echo local.properties updated.
) else (
    echo WARNING: SDK not found.
    echo Edit android\local.properties manually.
)
echo.

:: ---- JAVA VERSION PATCH ----
echo [2/3] Patching Java version (VERSION_21 to VERSION_17)...
powershell -Command ^
  "Get-ChildItem 'android' -Recurse -Filter '*.gradle' | ForEach-Object { " ^
  "  $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue; " ^
  "  if ($c -and $c -match 'VERSION_21') { " ^
  "    $c = $c -replace 'JavaVersion\.VERSION_21','JavaVersion.VERSION_17'; " ^
  "    $c = $c -replace 'VERSION_21','VERSION_17'; " ^
  "    Set-Content $_.FullName $c; " ^
  "    Write-Host ('  Patched: ' + $_.Name) " ^
  "  } " ^
  "}"
echo Java version patch done.
echo.

:: ---- CHECK GRADLEW ----
echo [3/3] Checking gradlew.bat...
if exist "android\gradlew.bat" (
    echo gradlew.bat OK
) else (
    echo ERROR: android\gradlew.bat not found!
    echo Make sure the android folder is present.
)

echo.
echo ============================================
echo   Fix complete. Run BUILD_APK.bat again.
echo ============================================
pause
