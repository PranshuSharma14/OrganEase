# 🚀 OrganEase - Complete Setup Guide

Follow these steps to get OrganEase running on your local machine.

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **Git** installed
- ✅ A code editor (VS Code recommended)
- ✅ Internet connection

---

## Step 1: Clone & Install

```bash
# Navigate to project directory
cd d:\Certifications\Hackathons\Cosmohack\OrganEaseCode

# Install dependencies (already done, but if needed)
npm install
```

---

## Step 2: Set Up PostgreSQL Database (Neon)

### Why Neon?
- Free tier available
- No local PostgreSQL installation needed
- Serverless and fast
- Perfect for hackathons

### Steps:

1. **Go to [neon.tech](https://neon.tech)**
2. **Sign up** with GitHub or Google
3. **Create a New Project:**
   - Project name: `organease`
   - Region: Choose closest to you
   - PostgreSQL version: 15 (default)
4. **Copy Connection String:**
   - Click on your project
   - Go to **Dashboard**
   - Copy the connection string (looks like):
     ```
     postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
5. **Save it** - you'll need it in Step 4

---

## Step 3: Set Up Google OAuth

### Steps:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create a New Project:**
   - Click "Select a project" → "New Project"
   - Name: `OrganEase`
   - Click "Create"

3. **Enable APIs:**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. **Create OAuth Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - If prompted, configure consent screen:
     - User Type: **External**
     - App name: `OrganEase`
     - User support email: your email
     - Developer contact: your email
     - Click **Save and Continue** (skip optional fields)
   - Application type: **Web application**
   - Name: `OrganEase Web`
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **Create**

5. **Copy Credentials:**
   - **Client ID**: Looks like `123456789-abcdefg.apps.googleusercontent.com`
   - **Client Secret**: Looks like `GOCSPX-abcd1234`
   - **Save both** - you'll need them in Step 4

---

## Step 4: Set Up Resend (Email Service)

### Steps:

1. **Go to [resend.com](https://resend.com)**
2. **Sign up** with email
3. **Verify your email**
4. **Get API Key:**
   - Go to **API Keys**
   - Click **Create API Key**
   - Name: `OrganEase Development`
   - Permission: **Full Access**
   - Click **Create**
   - **Copy the API key** (starts with `re_...`)
   - **Save it** - you can't see it again!

> **Note:** For development, you can use Resend's test mode. For production, you'll need to verify a domain.

---

## Step 5: Configure Environment Variables

Open `.env.local` file and fill in your values:

```env
# ============================================
# DATABASE (from Step 2)
# ============================================
DATABASE_URL=postgresql://your-neon-connection-string-here

# ============================================
# GOOGLE OAUTH (from Step 3)
# ============================================
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# ============================================
# NEXTAUTH
# ============================================
# Generate a secret key by running this in PowerShell:
# -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000

# ============================================
# RESEND EMAIL (from Step 4)
# ============================================
RESEND_API_KEY=re_your-api-key-here
EMAIL_FROM=noreply@organease.com

# ============================================
# APP CONFIG
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
UPLOAD_DIR=./uploads
```

### Generate NEXTAUTH_SECRET:

**Windows PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Mac/Linux Terminal:**
```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET`.

---

## Step 6: Initialize Database

Run these commands to set up your database:

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push
```

### What this does:
- Creates all tables (users, donors, recipients, hospitals, matches, etc.)
- Sets up relationships
- Creates indexes

### Verify Success:

You should see output like:
```
✔ Migrations generated successfully
✔ Schema pushed to database
```

### (Optional) View Database:

```bash
# Open Drizzle Studio - a visual database browser
npm run db:studio
```

This opens `https://local.drizzle.studio` in your browser where you can see all tables.

---

## Step 7: Run Development Server

```bash
npm run dev
```

### You should see:

```
  ▲ Next.js 16.0.10
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 2.3s
```

---

## Step 8: Test the Application

### 1. Open Browser:
Visit: [http://localhost:3000](http://localhost:3000)

### 2. You should see:
- ✅ Landing page with OrganEase branding
- ✅ "Register as Donor" / "Find a Donor" / "Hospital Login" buttons
- ✅ Live stats (animated)
- ✅ "How It Works" section
- ✅ Supported organs list

### 3. Test Sign Up:
1. Click **"Get Started"**
2. Select a role (Donor/Recipient/Hospital)
3. Click **"Continue with Google"**
4. Sign in with your Google account
5. You'll be redirected to onboarding

### 4. Expected Flow:
- First-time users → Onboarding page (to be created)
- Returning users → Dashboard

---

## Step 9: Verify Everything Works

### Check Database:
```bash
npm run db:studio
```

In Drizzle Studio, check the `users` table. You should see your account.

### Check Console:
Look for any errors in:
- Browser DevTools Console (F12)
- Terminal where `npm run dev` is running

---

## 🎯 Next Steps

Now that the foundation is working, you can:

1. **Create Onboarding Forms:**
   - `/src/app/onboarding/donor/page.tsx`
   - `/src/app/onboarding/recipient/page.tsx`
   - `/src/app/onboarding/hospital/page.tsx`

2. **Build Complete Dashboards:**
   - Donor dashboard (partially done)
   - Recipient dashboard
   - Hospital dashboard
   - Admin dashboard

3. **Implement Real-Time Features:**
   - WebSocket for chat
   - Real-time notifications
   - Live status updates

4. **Add File Uploads:**
   - Aadhaar documents
   - Medical certificates
   - Hospital letters

---

## 🐛 Common Issues & Fixes

### Issue: Database connection failed

**Fix:**
- Verify your `DATABASE_URL` in `.env.local`
- Make sure Neon project is active
- Check for typos in connection string

### Issue: Google OAuth error

**Fix:**
- Verify redirect URI is exactly: `http://localhost:3000/api/auth/callback/google`
- Check Client ID and Secret are correct
- Make sure OAuth consent screen is configured

### Issue: Email not sending

**Fix:**
- Verify Resend API key
- Check you're using the correct API key (starts with `re_`)
- For development, test mode works fine

### Issue: Port 3000 already in use

**Fix:**
```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate migrations
npm run db:push          # Push schema to DB
npm run db:studio        # Open visual DB browser

# Linting
npm run lint             # Check code quality
```

---

## 🔒 Security Checklist

- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] Never commit API keys to Git
- [ ] Use different keys for production
- [ ] Enable 2FA on all service accounts
- [ ] Regularly rotate secrets

---

## 🎉 You're All Set!

OrganEase is now running on your local machine. Start building amazing features to save lives!

Need help? Check:
- [README.md](./README.md) for project overview
- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [NextAuth Docs](https://next-auth.js.org)

---

**Built with ❤️ for Cosmohack**
