# 🫀 OrganEase - Hospital-Verified Living Organ Donation Platform

**OrganEase** is a real-time, hackathon-grade healthcare platform that connects donors, recipients, and hospitals for **living organ donation** with full verification, privacy, and ethical compliance.

---

## 🎯 Core Features

### ✅ Hospital-First Verification
- Hospitals act as central authority
- Verify donor identity + medical fitness
- Verify recipient medical need
- Approve/reject matches
- Generate consent PDFs

### ✅ Real-Time Matching Engine
- Blood group compatibility
- Location proximity
- Organ availability
- Emergency priority handling
- Smart scoring algorithm

### ✅ Secure Communication
- Chat enabled ONLY after hospital approval
- Masked identities
- Complete audit trail
- Privacy-protected

### ✅ Document Management
- Aadhaar verification
- Medical certificate uploads
- Hospital letter validation
- Consent PDF generation

### ✅ Four User Roles
1. **Donors** - Register, upload documents, manage availability
2. **Recipients** - Request organs, track status
3. **Hospitals** - Verify, approve, manage matches


---

## 🧱 Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Framer Motion** (animations)
- **Lucide Icons**

### Backend
- **Next.js API Routes / Server Actions**
- **NextAuth.js** (Google OAuth)
- **Drizzle ORM**
- **PostgreSQL** (via Neon)

### Real-Time
- **Socket.IO** (WebSocket for chat & notifications)
- Server-Sent Events (SSE) for status updates

### PDF Generation
- **@react-pdf/renderer**

### Email
- **Resend** (transactional emails)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **PostgreSQL database** (use [Neon](https://neon.tech) for free)
- **Google OAuth** credentials
- **Resend API key** (for emails)

### Installation

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Copy .env.local and fill in your values
\`\`\`

### Environment Setup

Edit `.env.local` and add:

\`\`\`env
# Database (Get from Neon.tech)
DATABASE_URL=postgresql://username:password@host/dbname

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth
NEXTAUTH_SECRET=your-secret-here  # Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Email (Get from Resend.com)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@organease.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### Database Setup

\`\`\`bash
# Generate database migration
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push
\`\`\`

### Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

---

## 🔐 Getting API Keys

### 1️⃣ Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   \`\`\`
   http://localhost:3000/api/auth/callback/google
   \`\`\`
7. Copy **Client ID** and **Client Secret** to `.env.local`

### 2️⃣ Neon Database Setup

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the **Connection String**
5. Paste it as `DATABASE_URL` in `.env.local`

### 3️⃣ Resend Email Setup

1. Go to [resend.com](https://resend.com)
2. Create account and verify domain (or use test mode)
3. Generate API key
4. Add to `.env.local` as `RESEND_API_KEY`

---

## 🫀 Living Organs Supported

OrganEase supports **ONLY living donations**:

- ✅ Kidney
- ✅ Partial Liver
- ✅ Bone Marrow / Stem Cells
- ✅ Blood (Whole / Plasma / Platelets)
- ✅ Partial Lung (rare)
- ✅ Partial Pancreas (rare)
- ✅ Skin (medical use)
- ✅ Blood Vessels / Tissues

❌ **NOT Supported**: Heart, Whole Lungs, Eyes, Brain (deceased-donor only)

---

## 📁 Project Structure

\`\`\`
OrganEaseCode/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   └── signup/
│   │   ├── dashboard/               # User dashboards
│   │   └── api/                     # API routes
│   ├── components/
│   │   └── ui/                      # shadcn components
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts            # Database schema
│   │   │   └── index.ts             # Drizzle client
│   │   ├── matching-engine.ts       # Matching algorithm
│   │   ├── notifications.ts         # Notification system
│   │   ├── pdf-generator.ts         # Consent PDF generator
│   │   ├── audit.ts                 # Audit logging
│   │   └── constants.ts             # App constants
│   └── types/
│       └── next-auth.d.ts           # TypeScript types
├── public/
│   └── consents/                    # Generated PDFs
├── .env.local                       # Environment variables
├── drizzle.config.ts                # Drizzle ORM config
└── README.md
\`\`\`

---

## 🔄 User Flows

### Donor Flow
1. Sign up with Google → Select "Donor" role
2. Complete profile (name, age, blood group, city, organs)
3. Upload Aadhaar + Medical certificate
4. Hospital verifies documents
5. Set availability (Active / Paused)
6. Get matched with compatible recipients
7. Hospital approves match
8. Secure chat enabled
9. Accept/reject match
10. PDF consent generated
11. Procedure scheduled

### Recipient Flow
1. Sign up → Select "Recipient" role
2. Complete profile (patient details, required organ, blood group)
3. Upload hospital letter + medical reports
4. Hospital verifies medical need
5. System finds compatible donors
6. Hospital approves match
7. Secure chat enabled
8. Accept/reject match
9. PDF consent generated
10. Tests & procedure scheduled

### Hospital Flow
1. Sign up → Select "Hospital" role
2. Provide hospital registration details
3. Admin verifies hospital credentials
4. Dashboard shows pending verifications
5. Review donor documents → Approve/Reject
6. Review recipient requests → Approve/Reject
7. Review matches → Approve/Reject
8. Generate consent PDF
9. Schedule tests & procedures
10. Mark donation as completed
11. Maintain audit trail

---

## 🔔 Notifications System

Users receive notifications for:
- ✅ Document verification completed
- ✅ Match found
- ✅ Match approved/rejected by hospital
- ✅ Chat enabled
- ✅ Consent PDF ready
- ✅ Tests scheduled
- ✅ Procedure scheduled
- ✅ Donation completed

Delivered via:
- **In-app alerts** (real-time)
- **Email** (Resend)
- **Dashboard updates** (WebSocket)

---

## 🛡️ Security & Privacy

- ✅ **No direct contact** until hospital approval
- ✅ **Aadhaar verification** for identity
- ✅ **Medical certificate** verification
- ✅ **Hospital letter** validation
- ✅ **Immutable audit logs** (who, what, when)
- ✅ **Role-based access control** (RBAC)
- ✅ **Encrypted data** in transit

---

## 📊 Matching Algorithm

The matching engine scores donor-recipient pairs based on:

1. **Blood Compatibility** (40 points)
2. **Location Proximity** (30 points)
3. **Emergency Priority** (20 points)
4. **Age Compatibility** (10 points)

**Total Score**: 0-100 (higher = better match)

---

## 📄 Consent PDF

Auto-generated when both parties and hospital approve.

**PDF Contains**:
- Donor & Recipient details
- Organ type
- Hospital verification
- Legal disclaimer
- Unique certificate ID

**Downloadable by**: Donor, Recipient, Hospital

---

## 🎨 UI/UX Features

- ✅ **Modern healthcare theme** (blue/teal)
- ✅ **Smooth animations** (Framer Motion)
- ✅ **Toast notifications** (Sonner)
- ✅ **Responsive design**
- ✅ **Timeline components**
- ✅ **Badge animations**

---

## 📦 Deployment

### Vercel (Recommended)

\`\`\`bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
\`\`\`

---

## ⚖️ Legal & Ethics

- ✅ Supports **ONLY living organ donation**
- ✅ Hospital verification mandatory
- ✅ Informed consent required
- ✅ Privacy-first design
- ✅ Complete audit trail

---

## 🙏 Acknowledgments

Built for **Cosmohack Hackathon** to save lives ethically and transparently.

---

<div align="center">

**Built with ❤️ for saving lives**

</div>
