@echo off
title Lotto AI - AAB Release Build
cd /d "%~dp0"

if not exist "package.json" (
    echo ERROR: Run this from inside the lotto-ai folder.
    pause & exit /b 1
)

echo.
echo ============================================
echo   Lotto AI  AAB Release Build [Mr. Robot]
echo ============================================
echo.

:: ---- JAVA ----
echo [1/6] Checking Java...
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
    if exist "C:\Program Files\Java\jdk-17\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-17"
        set "JAVA_EXE=C:\Program Files\Java\jdk-17\bin\java.exe"
    )
)
if not defined JAVA_EXE (
    echo ERROR: Java not found. Install Android Studio first.
    pause & exit /b 1
)
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Java: %JAVA_HOME%

:: ---- NODE ----
echo [2/6] Checking Node.js...
where npm >nul 2>&1
if errorlevel 1 ( echo ERROR: npm not found & pause & exit /b 1 )
echo Node.js OK

:: ---- KEYSTORE ----
echo [3/6] Keystore setup...
if not exist "lottoai.keystore" (
    echo Creating keystore - follow the prompts...
    echo (Remember this password - you need it for every update!)
    echo.
    "%JAVA_EXE%" -jar "%JAVA_HOME%\..\lib\tools.jar" 2>nul
    keytool -genkey -v ^
        -keystore lottoai.keystore ^
        -alias lottoai ^
        -keyalg RSA ^
        -keysize 2048 ^
        -validity 10000 ^
        -dname "CN=MrRobot, OU=App, O=MrRobot, L=Seoul, S=Seoul, C=KR"
    if errorlevel 1 (
        echo ERROR: keytool failed. Try running as Administrator.
        pause & exit /b 1
    )
    echo Keystore created: lottoai.keystore
    echo IMPORTANT: Back up this file safely!
)

set /p STORE_PASS=Keystore password: 
set /p KEY_PASS=Key password (same if same): 

:: ---- BUILD WEB ----
echo.
echo [4/6] Building web app...
if not exist "node_modules" call npm install
call npm run build
if errorlevel 1 ( echo ERROR: npm build failed & pause & exit /b 1 )
call npx cap sync android
if errorlevel 1 ( echo ERROR: cap sync failed & pause & exit /b 1 )
echo Web build OK

:: ---- LOCAL.PROPERTIES ----
if not exist "android\local.properties" (
    if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
        powershell -Command "$p='%LOCALAPPDATA%\Android\Sdk' -replace '\\\\','\\\\'; Set-Content 'android\local.properties' \"sdk.dir=$p\""
    )
)

:: ---- AAB BUILD ----
echo.
echo [5/6] Building AAB... (5-15 min)
echo Log: build_release_log.txt
cd android
call gradlew.bat bundleRelease --no-daemon ^
    -PKEYSTORE_PATH=..\lottoai.keystore ^
    -PKEYSTORE_PASSWORD=%STORE_PASS% ^
    -PKEY_ALIAS=lottoai ^
    -PKEY_PASSWORD=%KEY_PASS% ^
    > ..\build_release_log.txt 2>&1
set GERR=%errorlevel%
cd ..

if not "%GERR%"=="0" (
    echo.
    echo ERROR: AAB build failed!
    echo --- Last 25 lines ---
    powershell -Command "Get-Content 'build_release_log.txt' | Select-Object -Last 25"
    echo.
    echo Fix: run GRADLE_FIX.bat then retry
    pause & exit /b 1
)

:: ---- COPY ----
echo [6/6] Copying output...
set "AAB=android\app\build\outputs\bundle\release\app-release.aab"
if exist "%AAB%" (
    copy "%AAB%" "LottoAI_release.aab" >nul
    echo.
    echo ============================================
    echo   AAB BUILD SUCCESS!
    echo   Output: LottoAI_release.aab
    echo ============================================
    echo.
    echo Upload LottoAI_release.aab to Google Play Console:
    echo   play.google.com/console
    echo.
    echo App info:
    echo   Package : com.mrrobot.lottoai
    echo   Version : 1.0.0 (versionCode 1)
    echo   Min SDK : 24 (Android 7.0+)
) else (
    echo ERROR: AAB file not found
)
pause
