@echo off
title MSAM - Bascule vers les mises a jour automatiques
setlocal enabledelayedexpansion

echo ============================================================
echo  Ce script bascule MSAM vers le nouveau systeme de mise a
echo  jour automatique (via Git). Il ne touche pas a tes donnees
echo  (clients, factures, etc.) : elles restent intactes, stockees
echo  ailleurs sur ton PC.
echo ============================================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git n'est pas installe sur cet ordinateur.
  echo Installe-le depuis https://git-scm.com/download/win
  echo ^(installateur classique, "suivant, suivant, terminer" suffit^)
  echo puis relance ce fichier "Basculer MSAM sur Git.bat".
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe sur cet ordinateur.
  echo Installe-le depuis https://nodejs.org ^(version LTS, bouton du haut^)
  echo puis relance ce fichier.
  echo.
  pause
  exit /b 1
)

set "MSAM_DIR=%USERPROFILE%\Desktop\MSAM"

if exist "%MSAM_DIR%" (
  if exist "%MSAM_DIR%\.git" (
    echo Le dossier "%MSAM_DIR%" est deja relie a Git. Rien a faire.
    echo Utilise "Lancer MSAM.bat" comme d'habitude.
    echo.
    pause
    exit /b 0
  )

  echo Un dossier MSAM existant a ete trouve ^(installation actuelle^).
  echo Il va etre renomme en sauvegarde, puis remplace par une version
  echo reliee a Git pour les mises a jour automatiques.
  echo.

  set "BACKUP_DIR=%USERPROFILE%\Desktop\MSAM-ancien"
  if exist "!BACKUP_DIR!" (
    for /f "delims=" %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%T"
    set "BACKUP_DIR=%USERPROFILE%\Desktop\MSAM-ancien-!STAMP!"
  )

  move "%MSAM_DIR%" "!BACKUP_DIR!" >nul 2>nul
  if exist "%MSAM_DIR%" (
    echo.
    echo Impossible de deplacer l'ancien dossier ^(peut-etre ouvert dans
    echo l'Explorateur ou MSAM encore lance ?^). Ferme tout et relance ce
    echo script.
    echo.
    pause
    exit /b 1
  )
  echo Ancien dossier sauvegarde dans : !BACKUP_DIR!
  echo ^(tu peux le supprimer plus tard une fois sur que tout marche^)
  echo.
)

echo Recuperation de MSAM depuis GitHub...
echo.
git clone https://github.com/frakaprod/msam.git "%MSAM_DIR%"
if errorlevel 1 (
  echo.
  echo Le telechargement a echoue. Verifie ta connexion internet et
  echo relance ce script. Si l'ancien dossier a ete sauvegarde
  echo ^(MSAM-ancien...^), tu peux le renommer en "MSAM" pour revenir en
  echo arriere en attendant.
  echo.
  pause
  exit /b 1
)

echo.
echo MSAM est maintenant relie a Git. Desormais, MSAM verifiera et
echo proposera les mises a jour automatiquement a chaque lancement.
echo.
echo Lancement de MSAM...
echo.
cd /d "%MSAM_DIR%"
call "Lancer MSAM.bat"
