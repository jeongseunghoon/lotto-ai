@echo off
chcp 65001 >nul
title 로또AI 릴리즈 AAB 빌드

echo.
echo ╔══════════════════════════════════════╗
echo ║   로또AI - Release AAB 빌드 스크립트 ║
echo ╚══════════════════════════════════════╝
echo.

:: Keystore 경로 설정
set KEYSTORE_PATH=..\lottoai.keystore
set KEY_ALIAS=lottoai

:: keystore 없으면 생성
if not exist "lottoai.keystore" (
    echo 🔑 키스토어 생성 중...
    echo    (처음 1회만 실행됩니다)
    keytool -genkey -v -keystore lottoai.keystore -alias lottoai ^
        -keyalg RSA -keysize 2048 -validity 10000 ^
        -dname "CN=MrRobot, OU=App, O=MrRobot, L=Seoul, S=Seoul, C=KR"
    echo ✅ lottoai.keystore 생성 완료 - 안전하게 보관하세요!
    echo.
)

:: 패스워드 입력
set /p STORE_PASS=키스토어 비밀번호 입력: 
set /p KEY_PASS=키 비밀번호 입력: 

:: 빌드
call npm run build
call npx cap sync android

cd android
call .\gradlew.bat bundleRelease ^
    -PKEYSTORE_PATH=%KEYSTORE_PATH% ^
    -PKEYSTORE_PASSWORD=%STORE_PASS% ^
    -PKEY_ALIAS=%KEY_ALIAS% ^
    -PKEY_PASSWORD=%KEY_PASS% ^
    --no-daemon
cd ..

set AAB=android\app\build\outputs\bundle\release\app-release.aab
if exist "%AAB%" (
    copy "%AAB%" "로또AI_release.aab" >nul
    echo.
    echo ✅ AAB 완성: 로또AI_release.aab
    echo    → Google Play Console 업로드용
) else (
    echo ❌ AAB 빌드 실패 - Android Studio에서 수동 빌드하세요
)
pause
