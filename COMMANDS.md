# ⚡ OrganEase - Command Cheat Sheet

Quick reference for all common commands you'll need during development.

---

## 🚀 Getting Started

```bash
# Navigate to project directory
cd d:\Certifications\Hackathons\Cosmohack\OrganEaseCode

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Open in browser
# Visit: http://localhost:3000
```

---

## 🗄️ Database Commands

```bash
# Generate migration files from schema
npm run db:generate

# Push schema to database (no migration files)
npm run db:push

# Open Drizzle Studio (visual database browser)
npm run db:studio
# Opens: https://local.drizzle.studio

# Run migrations
npm run db:migrate
```

### Common Database Tasks:

```bash
# After editing schema.ts:
npm run db:generate
npm run db:push

# To inspect data:
npm run db:studio

# To reset database (CAREFUL!):
# 1. Delete all data in Neon dashboard
# 2. Run: npm run db:push
```

---

## 📦 Package Management

```bash
# Install a new package
npm install package-name

# Install dev dependency
npm install -D package-name

# Uninstall a package
npm uninstall package-name

# Update all packages
npm update

# Check for outdated packages
npm outdated

# Clean install (if issues)
rm -rf node_modules package-lock.json
npm install
```

### Useful Packages (Already Installed):

```bash
# Already available:
- next-auth
- drizzle-orm
- framer-motion
- @react-pdf/renderer
- socket.io
- resend
- zod
- zustand
- lucide-react
```

---

## 🔨 Build Commands

```bash
# Development mode
npm run dev

# Production build
npm run build

# Start production server (after build)
npm run start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

---

## 🧪 Testing & Debugging

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix

# Check bundle size
npm run build
# Look for "First Load JS" in output

# Analyze bundle (install first)
npm install -D @next/bundle-analyzer
# Add to next.config.ts
```

---

## 🌐 Port Management

```bash
# Kill process on port 3000 (if port in use)
npx kill-port 3000

# Use different port
npm run dev -- -p 3001

# Find what's using a port (Windows)
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <PID> /F
```

---

## 🔑 Environment Variables

```bash
# Generate random secret (Mac/Linux)
openssl rand -base64 32

# Generate random secret (Windows PowerShell)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Check if .env.local is loaded
# Add console.log(process.env.DATABASE_URL) in any API route
# Should NOT be undefined
```

---

## 📂 File Operations

```bash
# Create new component (PowerShell)
New-Item -ItemType File -Path "src\components\MyComponent.tsx"

# Create new page
New-Item -ItemType File -Path "src\app\newpage\page.tsx"

# Create new API route
New-Item -ItemType File -Path "src\app\api\newroute\route.ts"

# Create directory structure
New-Item -ItemType Directory -Path "src\components\donor" -Force
```

---

## 🐛 Debugging

```bash
# View detailed error logs
npm run dev
# Errors appear in terminal

# Clear Next.js cache
rm -rf .next

# Clear node cache
npm cache clean --force

# Restart with fresh install
rm -rf node_modules .next
npm install
npm run dev

# Check environment variables
# In any file:
console.log(process.env)
```

---

## 🔍 Search & Find

```bash
# Search for text in files (PowerShell)
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String "searchText"

# Find files by name
Get-ChildItem -Recurse -Filter "*page.tsx"

# Count lines of code
(Get-ChildItem -Recurse -Include *.ts,*.tsx | Get-Content).Count
```

---

## 📊 Git Commands

```bash
# Initialize git (if not done)
git init

# Check status
git status

# Stage all changes
git add .

# Commit changes
git commit -m "Your message here"

# Create new branch
git checkout -b feature/new-feature

# Push to remote
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Recommended Commit Messages:

```bash
git commit -m "feat: Add recipient dashboard"
git commit -m "fix: Resolve matching algorithm bug"
git commit -m "docs: Update README"
git commit -m "style: Format code"
git commit -m "refactor: Simplify API routes"
```

---

## 🚀 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Set environment variable
vercel env add DATABASE_URL
vercel env add GOOGLE_CLIENT_ID
# ... etc
```

---

## 📱 Testing

```bash
# Test in different browsers:
# Chrome: http://localhost:3000
# Firefox: http://localhost:3000
# Safari: http://localhost:3000
# Mobile: Use ngrok or local IP

# Get local IP (Windows)
ipconfig
# Look for "IPv4 Address"
# Access from phone: http://192.168.x.x:3000

# Using ngrok (for external testing)
npx ngrok http 3000
# Use generated URL
```

---

## 🔧 Troubleshooting Commands

### Problem: Port already in use
```bash
npx kill-port 3000
npm run dev
```

### Problem: Module not found
```bash
npm install
# Or if specific module:
npm install missing-module
```

### Problem: TypeScript errors
```bash
npx tsc --noEmit
# Fix errors shown
```

### Problem: Build fails
```bash
rm -rf .next
npm run build
```

### Problem: Database connection fails
```bash
# Check .env.local has correct DATABASE_URL
# Test connection:
npm run db:studio
```

### Problem: Auth not working
```bash
# Check .env.local has:
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL

# Clear browser cookies
# Try incognito mode
```

---

## 📚 Useful Scripts (Add to package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:migrate": "drizzle-kit migrate",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next node_modules",
    "clean:install": "rm -rf .next node_modules && npm install"
  }
}
```

---

## 💡 Development Tips

### Hot Reload Not Working?
```bash
# Restart dev server
Ctrl+C
npm run dev
```

### Need to Clear Everything?
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Want to See Build Size?
```bash
npm run build
# Look for "First Load JS" column
# Keep pages under 100KB
```

### Optimize Images?
```bash
# Use Next.js Image component
import Image from "next/image"
<Image src="/image.png" width={500} height={500} alt="..." />
```

---

## 🎯 Quick Actions

### Add New Page
```bash
# Create file
New-Item src\app\newpage\page.tsx

# Add code:
export default function NewPage() {
  return <div>New Page</div>
}

# Visit: http://localhost:3000/newpage
```

### Add New API Route
```bash
# Create file
New-Item src\app\api\newroute\route.ts

# Add code:
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}

# Test: http://localhost:3000/api/newroute
```

### Add New Component
```bash
# Create file
New-Item src\components\MyComponent.tsx

# Add code:
export function MyComponent() {
  return <div>My Component</div>
}

# Use:
import { MyComponent } from "@/components/MyComponent"
```

---

## 📞 Need Help?

```bash
# Check Next.js docs
open https://nextjs.org/docs

# Check Drizzle docs
open https://orm.drizzle.team

# Check NextAuth docs
open https://next-auth.js.org

# Check Tailwind docs
open https://tailwindcss.com/docs

# Check shadcn/ui docs
open https://ui.shadcn.com
```

---

## 🎉 Daily Workflow

```bash
# Morning:
git pull origin main
npm install
npm run dev

# During development:
# 1. Make changes
# 2. Test in browser
# 3. Check console for errors
# 4. Commit frequently

# Evening:
git add .
git commit -m "Day's progress"
git push origin main
```

---

## 🔥 Emergency Commands

### Everything Broke?
```bash
# Nuclear option:
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

### Database Corrupted?
```bash
# Reset database:
# 1. Go to Neon dashboard
# 2. Delete database
# 3. Create new database
# 4. Update DATABASE_URL in .env.local
# 5. npm run db:push
```

### Can't Log In?
```bash
# Clear browser storage:
# 1. Open DevTools (F12)
# 2. Application tab
# 3. Clear Site Data
# 4. Refresh page
```

---

**Keep this cheat sheet handy! Bookmark it! 🔖**

**Pro Tip: Use `Ctrl+F` to quickly find commands you need.**
