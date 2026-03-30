#!/bin/bash

echo "🚀 Couple Points App - GitHub Deployment Script"
echo ""

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "📥 Download from: https://git-scm.com/downloads"
    exit 1
fi

echo "✅ Git found!"
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " github_username
if [ -z "$github_username" ]; then
    echo "❌ Username cannot be empty"
    exit 1
fi

echo ""
echo "🔄 Initializing Git repository..."
git init
git add .

echo "📝 Committing files..."
git commit -m "Initial commit - Couple Points App"

echo "🔗 Connecting to GitHub..."
git remote add origin "https://github.com/$github_username/couple-points-app.git"

echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Go to: https://github.com/$github_username/couple-points-app"
echo "2. Click Settings → Pages"
echo "3. Enable GitHub Pages (Source: main branch, / (root))"
echo "4. Your app will be live at: https://$github_username.github.io/couple-points-app"
echo ""
echo "🎉 Your Couple Points App is ready to share!"
echo ""
