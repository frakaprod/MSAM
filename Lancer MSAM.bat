@echo off
title MSAM - Ma Secretaire a Moi
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js n'est pas installe sur cet ordinateur.
  echo Installe-le depuis https://nodejs.org ^(version LTS, bouton du haut^)
  echo puis relance ce fichier "Lancer MSAM.bat".
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo.
  echo Premiere installation de MSAM, ca peut prendre quelques minutes...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo Une erreur est survenue pendant l'installation. Copie ce message et envoie-le a Claude.
    echo.
    pause
    exit /b 1
  )
)

if not exist out (
  echo Construction de l'application ^(premiere fois seulement^)...
  call npm run build
)

call npm start
