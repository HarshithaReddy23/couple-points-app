@echo off
echo 🚀 Couple Points App - GitHub Deployment Script
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git first.
    echo 📥 Download from: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo ✅ Git found!
echo.

REM Get GitHub username
set /p github_username="Enter your GitHub username: "
if "%github_username%"=="" (
    echo ❌ Username cannot be empty
    pause
    exit /b 1
)

echo.
echo 🔄 Initializing Git repository...
git init
git add .

echo 📝 Committing files...
git commit -m "Initial commit - Couple Points App"

echo 🔗 Connecting to GitHub...
git remote add origin https://github.com/%github_username%/couple-points-app.git

echo 📤 Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ✅ Deployment complete!
echo.
echo 🎯 Next steps:
echo 1. Go to: https://github.com/%github_username%/couple-points-app
echo 2. Click Settings → Pages
echo 3. Enable GitHub Pages (Source: main branch, / (root))
echo 4. Your app will be live at: https://%github_username%.github.io/couple-points-app
echo.
echo 🎉 Your Couple Points App is ready to share!
echo.
pause
