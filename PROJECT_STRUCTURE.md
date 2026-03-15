# 📁 OrganEase - Complete Project Structure

```
OrganEaseCode/
│
├── 📄 .env.local                    # Environment variables (CONFIGURE THIS!)
├── 📄 .gitignore                    # Git ignore rules
├── 📄 README.md                     # Project overview & features
├── 📄 SETUP.md                      # Detailed setup instructions
├── 📄 QUICKSTART.md                 # Quick reference guide
├── 📄 package.json                  # Dependencies & scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 next.config.ts                # Next.js configuration
├── 📄 tailwind.config.ts            # Tailwind CSS configuration
├── 📄 drizzle.config.ts             # Drizzle ORM configuration
├── 📄 components.json               # shadcn/ui configuration
│
├── 📂 public/                       # Static assets
│   └── 📂 consents/                 # Generated consent PDFs (created at runtime)
│
├── 📂 src/                          # Source code
│   │
│   ├── 📂 app/                      # Next.js App Router
│   │   │
│   │   ├── 📄 layout.tsx            # Root layout (providers, fonts)
│   │   ├── 📄 page.tsx              # Landing page ⭐ COMPLETE
│   │   ├── 📄 globals.css           # Global styles
│   │   │
│   │   ├── 📂 auth/                 # Authentication pages
│   │   │   ├── 📂 signin/
│   │   │   │   └── 📄 page.tsx      # Sign in page ✅
│   │   │   └── 📂 signup/
│   │   │       └── 📄 page.tsx      # Sign up page ✅
│   │   │
│   │   ├── 📂 onboarding/           # User onboarding flows
│   │   │   ├── 📂 donor/
│   │   │   │   └── 📄 page.tsx      # Donor onboarding form ⭐ COMPLETE
│   │   │   ├── 📂 recipient/
│   │   │   │   └── 📄 page.tsx      # ⚠️ TO CREATE (similar to donor)
│   │   │   └── 📂 hospital/
│   │   │       └── 📄 page.tsx      # ⚠️ TO CREATE
│   │   │
│   │   ├── 📂 dashboard/            # Role-based dashboards
│   │   │   ├── 📂 donor/
│   │   │   │   └── 📄 page.tsx      # Donor dashboard ⭐ COMPLETE
│   │   │   ├── 📂 recipient/
│   │   │   │   └── 📄 page.tsx      # ⚠️ TO CREATE
│   │   │   ├── 📂 hospital/
│   │   │   │   └── 📄 page.tsx      # ⚠️ TO CREATE (most complex)
│   │   │   └── 📂 admin/
│   │   │       └── 📄 page.tsx      # ⚠️ TO CREATE
│   │   │
│   │   └── 📂 api/                  # API routes
│   │       │
│   │       ├── 📂 auth/
│   │       │   └── 📂 [...nextauth]/
│   │       │       └── 📄 route.ts  # NextAuth handler ✅
│   │       │
│   │       ├── 📂 profile/
│   │       │   └── 📄 route.ts      # Profile CRUD ⭐ COMPLETE
│   │       │
│   │       ├── 📂 matches/
│   │       │   └── 📄 route.ts      # Match finding & management ⭐
│   │       │
│   │       ├── 📂 notifications/
│   │       │   └── 📄 route.ts      # Notification system ⭐
│   │       │
│   │       └── 📂 pdf/
│   │           └── 📂 consent/
│   │               └── 📄 route.ts  # PDF generation endpoint ⭐
│   │
│   ├── 📂 components/               # React components
│   │   │
│   │   └── 📂 ui/                   # shadcn/ui components ✅
│   │       ├── 📄 button.tsx
│   │       ├── 📄 card.tsx
│   │       ├── 📄 input.tsx
│   │       ├── 📄 label.tsx
│   │       ├── 📄 select.tsx
│   │       ├── 📄 textarea.tsx
│   │       ├── 📄 badge.tsx
│   │       ├── 📄 avatar.tsx
│   │       ├── 📄 dropdown-menu.tsx
│   │       ├── 📄 dialog.tsx
│   │       ├── 📄 tabs.tsx
│   │       ├── 📄 table.tsx
│   │       └── 📄 sonner.tsx        # Toast notifications
│   │
│   ├── 📂 lib/                      # Core library functions
│   │   │
│   │   ├── 📂 db/                   # Database
│   │   │   ├── 📄 schema.ts         # ⭐ Complete schema (20+ tables)
│   │   │   └── 📄 index.ts          # Drizzle client ✅
│   │   │
│   │   ├── 📄 constants.ts          # App constants ⭐
│   │   ├── 📄 utils.ts              # Utility functions ✅
│   │   ├── 📄 matching-engine.ts    # ⭐ Donor-recipient matching algorithm
│   │   ├── 📄 pdf-generator.ts      # ⭐ Consent PDF generation
│   │   ├── 📄 notifications.ts      # ⭐ Email & in-app notifications
│   │   └── 📄 audit.ts              # ⭐ Audit trail logging
│   │
│   ├── 📂 types/                    # TypeScript type definitions
│   │   └── 📄 next-auth.d.ts        # NextAuth type extensions ✅
│   │
│   ├── 📄 auth.ts                   # ⭐ NextAuth configuration
│   └── 📄 middleware.ts             # ⭐ Route protection
│
└── 📂 node_modules/                 # Dependencies (installed)
```

---

## 📋 File Status Legend

- ⭐ **COMPLETE** - Fully implemented and ready
- ✅ **DONE** - Created/configured, working
- ⚠️ **TO CREATE** - Needs implementation
- 🔄 **PARTIAL** - Started but incomplete

---

## 🎯 What Each Directory Does

### `/src/app/` - Next.js Pages & Routes
- **Purpose**: User-facing pages and API endpoints
- **Key Files**: Landing page, auth pages, dashboards
- **Structure**: File-based routing (Next.js App Router)

### `/src/components/` - Reusable UI Components
- **Purpose**: Shared React components
- **Current**: shadcn/ui base components
- **To Add**: Custom components (chat, timeline, file upload)

### `/src/lib/` - Core Business Logic
- **Purpose**: Database, algorithms, utilities
- **Key Files**: 
  - `schema.ts` - Database structure
  - `matching-engine.ts` - Donor-recipient matching
  - `pdf-generator.ts` - PDF creation
  - `notifications.ts` - Alert system

### `/src/types/` - TypeScript Definitions
- **Purpose**: Type safety
- **Files**: next-auth.d.ts (session types)

---

## 🔑 Critical Files Explained

### 📄 `.env.local`
```env
DATABASE_URL=          # PostgreSQL connection string
GOOGLE_CLIENT_ID=      # OAuth credentials
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=       # Random secret key
RESEND_API_KEY=        # Email service API key
```

### 📄 `src/lib/db/schema.ts` (⭐ MOST IMPORTANT)
Defines all database tables:
- Users & authentication
- Donor profiles
- Recipient profiles
- Hospital profiles
- Matches (donor-recipient pairs)
- Chat messages
- Notifications
- Audit logs

**Relations**: All entities properly linked with foreign keys

### 📄 `src/lib/matching-engine.ts`
**Algorithm**:
1. Find donors with required organ
2. Check blood compatibility
3. Calculate distance score
4. Factor in emergency priority
5. Consider age compatibility
6. Return sorted matches (best first)

### 📄 `src/lib/pdf-generator.ts`
**Generates**: Legal consent PDF
**Contains**: Donor info, recipient info, organ type, hospital verification
**Triggered**: When all parties accept match

### 📄 `src/auth.ts`
**Configures**:
- Google OAuth provider
- Drizzle database adapter
- Session callbacks
- User role handling

---

## 🛣️ User Journey Through Files

### Donor Registration:
```
1. Landing page (app/page.tsx)
2. Sign up (app/auth/signup/page.tsx)
3. Google OAuth (auth.ts)
4. Onboarding form (app/onboarding/donor/page.tsx)
5. API: Create profile (app/api/profile/route.ts)
6. Dashboard (app/dashboard/donor/page.tsx)
```

### Hospital Approving Match:
```
1. Hospital dashboard (⚠️ TO CREATE)
2. View pending matches
3. Review documents
4. API: Approve match (app/api/matches/route.ts)
5. Trigger: PDF generation (lib/pdf-generator.ts)
6. Trigger: Notifications (lib/notifications.ts)
7. Audit: Log action (lib/audit.ts)
```

---

## 🏗️ What to Build Next

### Priority 1: Core User Flows

#### Recipient Onboarding (`app/onboarding/recipient/page.tsx`)
- Similar to donor onboarding
- Fields: patient name, age, required organ, blood group
- Upload: hospital letter, medical reports
- Priority: normal/high/emergency

#### Hospital Onboarding (`app/onboarding/hospital/page.tsx`)
- Hospital details
- Registration number
- Coordinator information
- Verification documents

#### Hospital Dashboard (`app/dashboard/hospital/page.tsx`)
**Most Complex - Core of Platform**
- View pending donor verifications
- View pending recipient verifications
- Review matches
- Approve/reject actions
- Schedule tests/procedures
- Generate PDFs
- View audit trail

### Priority 2: Supporting Features

#### Secure Chat Component (`components/chat/`)
- Only enabled after hospital approval
- Real-time messaging
- Message history
- Read receipts

#### File Upload (`lib/upload.ts`)
- Currently: Files saved locally
- Implement: Cloud storage (AWS S3, Cloudflare R2)
- Handle: File validation, size limits, types

#### Admin Dashboard (`app/dashboard/admin/page.tsx`)
- System statistics
- User management
- Audit log viewer
- Flag suspicious activity

---

## 📊 Database Relationships

```
users (1) ──┬── (1) donorProfiles
            ├── (1) recipientProfiles
            ├── (1) hospitalProfiles
            └── (n) notifications

matches (n) ── (1) donorProfiles
matches (n) ── (1) recipientProfiles
matches (n) ── (1) hospitalProfiles
matches (1) ── (n) chatMessages

auditLogs ──> users (reference only)
```

---

## 🔐 Security Implementation

### Middleware (`src/middleware.ts`)
- Protects all routes except public pages
- Checks session validity
- Redirects unauthenticated users

### API Route Protection
Each API route checks:
1. User is authenticated
2. User has correct role
3. User can access requested resource

### Audit Logging
Every sensitive action logged:
- Who performed it
- What changed
- When it happened
- Previous vs new state

---

## 🎨 UI Component System

### Base Components (shadcn/ui)
Located in `components/ui/`:
- Pre-built, accessible components
- Customizable with Tailwind
- Follows Radix UI primitives

### Custom Components (To Create)
Recommended structure:
```
components/
├── donor/
│   ├── DonorCard.tsx
│   ├── DonorTimeline.tsx
│   └── DonorStats.tsx
├── recipient/
│   ├── RecipientCard.tsx
│   └── RecipientTimeline.tsx
├── hospital/
│   ├── VerificationPanel.tsx
│   ├── MatchApproval.tsx
│   └── DocumentViewer.tsx
└── shared/
    ├── Timeline.tsx
    ├── FileUpload.tsx
    └── ChatWidget.tsx
```

---

## 🔄 Real-Time Features (To Implement)

### WebSocket Setup
```typescript
// lib/socket.ts
import { Server as SocketServer } from "socket.io";
import { Server as NetServer } from "http";

// Socket.IO configuration
// Events: match_approved, new_message, status_updated
```

### Notification System
Current: Database-based notifications
To Add: Real-time push via WebSocket

---

## 📦 Dependencies Overview

### Production Dependencies
- `next` - Framework
- `react` / `react-dom` - UI library
- `next-auth` - Authentication
- `drizzle-orm` - Database ORM
- `postgres` - PostgreSQL driver
- `framer-motion` - Animations
- `@react-pdf/renderer` - PDF generation
- `resend` - Email service
- `zod` - Schema validation
- `zustand` - State management
- `socket.io` - Real-time (not yet used)

### Dev Dependencies
- `typescript` - Type safety
- `@types/*` - Type definitions
- `tailwindcss` - Styling
- `drizzle-kit` - Database migrations
- `eslint` - Code linting

---

## 💡 Development Workflow

### Making Database Changes:
```bash
# 1. Edit src/lib/db/schema.ts
# 2. Generate migration
npm run db:generate
# 3. Apply to database
npm run db:push
# 4. Verify in Drizzle Studio
npm run db:studio
```

### Adding New Page:
1. Create file in `src/app/[path]/page.tsx`
2. Add to navigation/routing
3. Implement components
4. Add API routes if needed
5. Test authentication flow

### Creating API Endpoint:
1. Create `src/app/api/[name]/route.ts`
2. Export GET/POST/PATCH/DELETE functions
3. Add authentication check
4. Implement business logic
5. Add audit logging
6. Test with Postman/Thunder Client

---

## 🚀 Quick Navigation

**Need to:**
- Add new user field? → `src/lib/db/schema.ts`
- Change matching algorithm? → `src/lib/matching-engine.ts`
- Modify PDF layout? → `src/lib/pdf-generator.ts`
- Add notification? → `src/lib/notifications.ts`
- Create new page? → `src/app/[path]/page.tsx`
- Add API endpoint? → `src/app/api/[name]/route.ts`
- Style component? → `src/components/ui/`
- Configure app? → `.env.local`

---

**This structure provides a complete, scalable foundation for a production-grade healthcare platform! 🏥💙**
