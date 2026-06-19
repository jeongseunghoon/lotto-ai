@echo off
title Lotto AI - APK Build
cd /d "%~dp0"

if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this file from inside the lotto-ai folder.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Lotto AI APK Build Script  [Mr. Robot]
echo ============================================
echo.

:: ---- JAVA AUTO DETECT ----
echo [1/5] Checking Java...
set "JAVA_EXE="

if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
)
if not defined JAVA_EXE (
    if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
        set "JAVA_EXE=C:\Program Files\Android\Android Studio\jbr\bin\java.exe"
    )
)
if not defined JAVA_EXE (
    if exist "C:\Program Files\Android\Android Studio\jre\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jre"
        set "JAVA_EXE=C:\Program Files\Android\Android Studio\jre\bin\java.exe"
    )
)
if not defined JAVA_EXE (
    if exist "C:\Program Files\Java\jdk-17\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-17"
        set "JAVA_EXE=C:\Program Files\Java\jdk-17\bin\java.exe"
    )
)
if not defined JAVA_EXE (
    if exist "C:\Program Files\Java\jdk-21\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-21"
        set "JAVA_EXE=C:\Program Files\Java\jdk-21\bin\java.exe"
    )
)
if not defined JAVA_EXE (
    where java >nul 2>&1
    if not errorlevel 1 set "JAVA_EXE=java"
)

if not defined JAVA_EXE (
    echo ERROR: Java not found!
    echo Please install Android Studio from:
    echo   https://developer.android.com/studio
    pause
    exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Java OK: %JAVA_HOME%
"%JAVA_EXE%" -version 2>&1
echo.

:: ---- NODE.JS CHECK ----
echo [2/5] Checking Node.js...
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Install from: https://nodejs.org
    pause
    exit /b 1
)
echo Node.js OK
echo.

:: ---- NPM INSTALL ----
echo [3/5] Checking packages...
if not exist "node_modules" (
    echo Installing packages - please wait 1-2 minutes...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
)
echo Packages OK
echo.

:: ---- WEB BUILD ----
echo [4/5] Building web app...
call npm run build
if errorlevel 1 (
    echo ERROR: npm run build failed
    pause
    exit /b 1
)

call npx cap sync android
if errorlevel 1 (
    echo ERROR: cap sync failed
    pause
    exit /b 1
)
echo Web build OK
echo.

:: ---- LOCAL.PROPERTIES ----
if not exist "android\local.properties" (
    echo Creating android\local.properties...
    if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
        powershell -Command "(Get-Content -Raw 'nul') 2>$null; $p = '%LOCALAPPDATA%\Android\Sdk' -replace '\\\\','\\\\'; Set-Content 'android\local.properties' \"sdk.dir=$p\""
        echo SDK found: %LOCALAPPDATA%\Android\Sdk
    ) else (
        echo WARNING: Android SDK not found automatically.
        echo Please edit android\local.properties manually:
        echo   sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
    )
)

:: ---- GRADLE BUILD ----
echo [5/5] Building APK... (first run takes 5-10 min)
echo Log file: build_log.txt
echo.

cd android
call gradlew.bat assembleDebug --no-daemon > "..\build_log.txt" 2>&1
set GRADLE_ERR=%errorlevel%
cd ..

if not "%GRADLE_ERR%"=="0" (
    echo.
    echo ERROR: Gradle build failed!
    echo.
    echo --- Last 20 lines of build_log.txt ---
    powershell -Command "Get-Content 'build_log.txt' | Select-Object -Last 20"
    echo --------------------------------------
    echo.
    echo Common fixes:
    echo   Java version error  - run GRADLE_FIX.bat then retry
    echo   SDK path error      - run GRADLE_FIX.bat then retry
    echo   Network error       - check internet and retry
    echo.
    pause
    exit /b 1
)

:: ---- SUCCESS ----
set "APK=android\app\build\outputs\apk\debug\app-debug.apk"
if exist "%APK%" (
    copy "%APK%" "LottoAI_debug.apk" >nul
)

echo.
echo ============================================
echo   BUILD SUCCESS!
echo   Output: LottoAI_debug.apk
echo ============================================
echo.
echo Install options:
echo   USB : adb install LottoAI_debug.apk
echo   File: Copy apk to phone and open it
echo.
pause
