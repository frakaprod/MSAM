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

if not exist "node_modules\electron\dist\electron.exe" (
  echo.
  echo Le moteur de l'application ^(Electron^) n'a pas fini de se telecharger.
  echo Nouvelle tentative ^(ca peut prendre une minute ou deux^)...
  echo.
  call npm approve-scripts --all >nul 2>nul
  if exist "node_modules\electron" rmdir /s /q "node_modules\electron"
  call npm install
  if not exist "node_modules\electron\dist\electron.exe" (
    echo.
    echo ============================================================
    echo  Le telechargement du moteur Electron a echoue.
    echo  Verifie ta connexion internet, et regarde si ton antivirus
    echo  ou pare-feu a bloque quelque chose ^(notification recente ?^).
    echo  Puis relance ce fichier. Si ca persiste, copie tout le texte
    echo  affiche dans cette fenetre et envoie-le a Claude.
    echo ============================================================
    echo.
    pause
    exit /b 1
  )
  echo Le moteur Electron est maintenant installe.
)

if not exist out (
  echo Construction de l'application ^(premiere fois seulement^)...
  call npm run build
  if errorlevel 1 (
    echo.
    echo Une erreur est survenue pendant la construction. Copie ce message et envoie-le a Claude.
    echo.
    pause
    exit /b 1
  )
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
