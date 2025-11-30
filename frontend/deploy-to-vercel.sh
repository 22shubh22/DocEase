#!/bin/bash

echo "🚀 DocEase Frontend - Vercel Deployment Helper"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔨 Step 2: Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "OPTION 1: Deploy via Vercel Dashboard (Easiest)"
echo "  1. Push your code to GitHub:"
echo "     git init"
echo "     git add ."
echo "     git commit -m 'Initial commit'"
echo "     git remote add origin https://github.com/YOUR_USERNAME/docease-frontend.git"
echo "     git push -u origin main"
echo ""
echo "  2. Go to https://vercel.com"
echo "  3. Sign up with GitHub"
echo "  4. Click 'Add New' → 'Project'"
echo "  5. Import your GitHub repo"
echo "  6. Click 'Deploy'"
echo ""
echo "OPTION 2: Deploy via CLI"
echo "  1. Install Vercel CLI: npm install -g vercel"
echo "  2. Login: vercel login"
echo "  3. Deploy: vercel --prod"
echo ""
echo "Your build is ready in the 'dist' folder!"
echo "✨ Happy deploying!"
