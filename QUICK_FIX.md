# Quick Fix for 404 Errors

## Issues Fixed

1. ✅ **Updated middleware** to allow auth routes
2. ✅ **Made bcryptjs optional** until installed
3. ✅ **Added better error handling** for missing dependencies

## Install Required Package

Run this command now:

```bash
npm install bcryptjs @types/bcryptjs
```

## Restart Development Server

After installing bcryptjs:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## What Changed

### 1. Middleware (`src/middleware.ts`)
- Now explicitly allows `/auth/signin`, `/auth/signup`, and `/api/auth/*` routes
- Better handling of public vs protected routes
- Won't redirect auth pages anymore

### 2. Auth Configuration (`src/auth.ts`)
- Gracefully handles missing bcryptjs package
- Google OAuth will work immediately
- Credential auth enables automatically after bcryptjs is installed

### 3. Signup API (`src/app/api/auth/signup/route.ts`)
- Shows helpful error if bcryptjs not installed
- Suggests using Google sign-in as alternative

## Test After Installing

1. **Sign Up Page**: http://localhost:3000/auth/signup
2. **Sign In Page**: http://localhost:3000/auth/signin

Both should load properly now! The Google OAuth will work immediately, and credential auth will work after installing bcryptjs.
