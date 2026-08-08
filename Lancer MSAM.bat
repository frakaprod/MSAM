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

where git >nul 2>nul
if errorlevel 1 (
  echo.
  echo [Info] Git n'est pas installe : les mises a jour automatiques sont
  echo desactivees. Pour les activer, installe Git depuis https://git-scm.com/download/win
  echo puis relance ce fichier.
  echo.
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

if not exist "node_modules\electron\dist\electron.exe" (
  echo.
  echo Le moteur de l'application ^(Electron^) n'a pas fini de se telecharger.
  echo Nouvelle tentative ^(ca peut prendre une minute ou deux^)...
  echo.
  if exist "%LOCALAPPDATA%\electron\Cache" rmdir /s /q "%LOCALAPPDATA%\electron\Cache"
  if exist "%APPDATA%\electron\Cache" rmdir /s /q "%APPDATA%\electron\Cache"
  set ELECTRON_SKIP_BINARY_DOWNLOAD=
  set ELECTRON_MIRROR=
  set ELECTRON_CUSTOM_DIR=
  set npm_config_electron_skip_binary_download=
  (
    echo --- appel direct du telechargeur d'Electron ---
    node "node_modules\electron\install.js"
  ) > "electron-install-log.txt" 2>&1
  type electron-install-log.txt
  if not exist "node_modules\electron\dist\electron.exe" (
    echo.
    echo ============================================================
    echo  Le telechargement du moteur Electron a encore echoue.
    echo  Un rapport detaille a ete enregistre juste a cote de ce
    echo  fichier, dans "electron-install-log.txt".
    echo  Glisse ce fichier dans la conversation avec Claude.
    echo ============================================================
    echo.
    pause
    exit /b 1
  )
  del /q "electron-install-log.txt" >nul 2>nul
  echo Le moteur Electron est maintenant installe.
)

echo Construction de l'application...
call npm run build
if errorlevel 1 (
  echo.
  echo Une erreur est survenue pendant la construction. Copie ce message et envoie-le a Claude.
  echo.
  pause
  exit /b 1
)

echo.
echo Lancement de MSAM...
echo.
call npm start
echo.
echo ============================================================
echo  MSAM s'est ferme. Si aucune fenetre ne s'est ouverte,
echo  copie tout le texte ci-dessus et envoie-le a Claude.
echo ============================================================
pause
