# Deploy DocEase Frontend to Vercel (Free)

## Prerequisites
- GitHub account (free)
- Vercel account (free)

## Step-by-Step Deployment Guide

### Option 1: Deploy via Vercel Dashboard (Recommended - Easiest)

#### Step 1: Push Your Code to GitHub
```bash
# Navigate to your frontend directory
cd /Users/shubhamgoyal/non-cognavi/DocEase/frontend

# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit - DocEase frontend"

# Create a new repository on GitHub (go to github.com)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/docease-frontend.git
git branch -M main
git push -u origin main
```

#### Step 2: Deploy on Vercel
1. Go to https://vercel.com/signup
2. Sign up with your GitHub account (it's free!)
3. Click "Add New..." → "Project"
4. Import your GitHub repository (docease-frontend)
5. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (keep as is)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)
6. Click "Deploy"
7. Wait 1-2 minutes for deployment to complete
8. Your app will be live at: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI (For Advanced Users)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
# Navigate to frontend directory
cd /Users/shubhamgoyal/non-cognavi/DocEase/frontend

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? docease-frontend (or your choice)
# - Directory? ./ (current directory)
# - Override settings? No

# For production deployment:
vercel --prod
```

## After Deployment

### Your app will be accessible at:
- **Preview URL**: `https://docease-frontend-xxx.vercel.app` (temporary)
- **Production URL**: `https://docease-frontend.vercel.app` (permanent)

### Custom Domain (Optional)
1. Go to Vercel Dashboard
2. Select your project
3. Click "Settings" → "Domains"
4. Add your custom domain (if you have one)

## Environment Variables (If Needed Later)

When you connect to a real backend API later:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add your variables:
   - `VITE_API_URL` = `https://your-backend-api.com`
3. Redeploy the project

## Automatic Deployments

Once connected to GitHub:
- Every `git push` to `main` branch = automatic production deployment
- Every PR/branch push = automatic preview deployment

## Free Tier Limits

Vercel Free Tier includes:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ✅ Preview deployments
- ✅ Serverless functions (100 GB-hours)

Perfect for your clinic management app!

## Troubleshooting

### Build fails?
Check the build logs in Vercel dashboard and ensure:
- All dependencies are in `package.json`
- No TypeScript errors
- Build works locally: `npm run build`

### Routing issues (404 on refresh)?
The `vercel.json` file handles this automatically with the rewrite rule.

### Need help?
Check Vercel docs: https://vercel.com/docs
