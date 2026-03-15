# 🎯 OrganEase - Quick Reference

## Project Status: ✅ READY FOR DEVELOPMENT

### What's Built:
✅ Complete project structure  
✅ Database schema (20+ tables)  
✅ Authentication system (Google OAuth)  
✅ Landing page with animations  
✅ Donor onboarding flow  
✅ Donor dashboard  
✅ API routes (profile, matches, notifications, PDF)  
✅ Matching engine algorithm  
✅ PDF consent generator  
✅ Audit logging system  
✅ Notification system  
✅ UI components (shadcn/ui)  

### To Complete:
🔲 Recipient onboarding & dashboard  
🔲 Hospital onboarding & dashboard  
🔲 Admin panel  
🔲 Secure chat component  
🔲 File upload to cloud storage  
🔲 Real-time WebSocket setup  
🔲 Complete API implementations  

---

## 📁 Key Files Created

### Core Configuration
- `drizzle.config.ts` - Database config
- `.env.local` - Environment variables
- `src/auth.ts` - NextAuth setup
- `src/middleware.ts` - Route protection

### Database
- `src/lib/db/schema.ts` - Complete schema (users, donors, recipients, hospitals, matches, etc.)
- `src/lib/db/index.ts` - Drizzle client
- `src/lib/constants.ts` - App constants

### Business Logic
- `src/lib/matching-engine.ts` - Smart donor-recipient matching
- `src/lib/pdf-generator.ts` - Consent PDF generation
- `src/lib/notifications.ts` - Email & in-app notifications
- `src/lib/audit.ts` - Audit trail logging

### Pages
- `src/app/page.tsx` - Landing page
- `src/app/auth/signin/page.tsx` - Sign in
- `src/app/auth/signup/page.tsx` - Sign up
- `src/app/onboarding/donor/page.tsx` - Donor onboarding
- `src/app/dashboard/donor/page.tsx` - Donor dashboard

### API Routes
- `src/app/api/auth/[...nextauth]/route.ts` - Auth handler
- `src/app/api/profile/route.ts` - Profile CRUD
- `src/app/api/matches/route.ts` - Matching operations
- `src/app/api/notifications/route.ts` - Notification management
- `src/app/api/pdf/consent/route.ts` - PDF generation

---

## 🚀 How to Start

### First Time Setup:
```bash
# 1. Set up environment variables in .env.local
# 2. Initialize database
npm run db:generate
npm run db:push

# 3. Start development server
npm run dev
```

### After Setup:
```bash
npm run dev
```

Visit: http://localhost:3000

---

## 🔑 Required Services

### 1. **Neon Database** (PostgreSQL)
- URL: https://neon.tech
- Action: Create project, copy connection string
- Add to: `DATABASE_URL` in `.env.local`

### 2. **Google OAuth**
- URL: https://console.cloud.google.com
- Action: Create OAuth client, get credentials
- Add to: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### 3. **Resend** (Email)
- URL: https://resend.com
- Action: Get API key
- Add to: `RESEND_API_KEY`

### 4. **NextAuth Secret**
- Generate: `openssl rand -base64 32` (Mac/Linux)
- Or use: PowerShell random string generator
- Add to: `NEXTAUTH_SECRET`

---

## 📊 Database Schema Overview

### Users & Auth
- `users` - Base user accounts
- `sessions` / `accounts` - NextAuth tables

### User Profiles
- `donorProfiles` - Donor information
- `recipientProfiles` - Recipient information
- `hospitalProfiles` - Hospital information

### Operations
- `matches` - Donor-recipient pairings
- `chatMessages` - Secure messaging
- `notifications` - Real-time alerts
- `auditLogs` - Immutable activity log

---

## 🎨 Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

**Backend:**
- Next.js API Routes
- NextAuth.js
- Drizzle ORM
- PostgreSQL (Neon)

**External:**
- Google OAuth
- Resend (Email)
- React PDF

---

## 🔄 Matching Algorithm

Score calculation (0-100):
- **Blood Compatibility**: 40 points
- **Location (same state)**: 30 points
- **Emergency Priority**: 20 points
- **Age Compatibility**: 10 points

---

## 📝 User Roles & Features

### **Donor**
- Register with organs available
- Upload Aadhaar + medical certificate
- Manage availability status
- View matches
- Accept/reject matches
- Secure chat (post-approval)

### **Recipient**
- Register with required organ
- Upload hospital letter
- Priority level (normal/emergency)
- View compatible donors
- Accept/reject matches
- Secure chat (post-approval)

### **Hospital**
- Verify donor documents
- Verify recipient medical need
- Approve/reject matches
- Generate consent PDFs
- Schedule procedures
- Mark donations complete

### **Admin**
- View all system activity
- Access audit logs
- Flag suspicious users
- System health monitoring

---

## 🛡️ Privacy & Security

✅ No contact between donor/recipient until hospital approval  
✅ Masked identities in chat  
✅ Role-based access control  
✅ Immutable audit logs  
✅ Document verification  
✅ Hospital-first workflow  

---

## 📄 Consent PDF

Auto-generates when:
- Donor accepts ✓
- Recipient accepts ✓
- Hospital approves ✓

Contains:
- Both party details
- Organ type
- Hospital verification
- Timestamps
- Legal disclaimer
- Unique ID

---

## 🫀 Supported Organs (Living Donations Only)

✅ Kidney  
✅ Partial Liver  
✅ Bone Marrow / Stem Cells  
✅ Blood (Whole/Plasma/Platelets)  
✅ Partial Lung (rare)  
✅ Partial Pancreas (rare)  
✅ Skin (medical)  
✅ Blood Vessels / Tissues  

❌ Heart, Whole Lungs, Eyes, Brain (deceased only)

---

## 🎯 Next Development Steps

### Priority 1 (MVP Complete):
1. Complete recipient onboarding + dashboard
2. Complete hospital onboarding + dashboard
3. Implement file upload (local or cloud)
4. Test full donor-to-recipient flow
5. Add basic chat functionality

### Priority 2 (Enhancement):
1. Real-time WebSocket notifications
2. Admin dashboard
3. Email notification triggers
4. PDF download functionality
5. Document verification UI

### Priority 3 (Polish):
1. Mobile responsive design
2. Loading states & skeletons
3. Error handling & validation
4. Accessibility improvements
5. Performance optimization

---

## 📚 Documentation

- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - Detailed setup guide
- This file - Quick reference

---

## 🔧 Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Run production

# Database
npm run db:generate  # Generate migrations
npm run db:push      # Push to database
npm run db:studio    # Visual DB browser

# Linting
npm run lint         # Check code quality
```

---

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **Drizzle**: https://orm.drizzle.team
- **NextAuth**: https://next-auth.js.org
- **Tailwind**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

---

## 💡 Tips

1. **Database Changes**: Always run `npm run db:push` after schema changes
2. **Auth Issues**: Clear browser cookies if OAuth acting weird
3. **Hot Reload**: Sometimes needs manual refresh
4. **Env Changes**: Restart dev server after `.env.local` updates
5. **Database**: Use `npm run db:studio` to inspect data visually

---

## 🐛 Common Gotchas

- **Middleware**: Blocks all routes by default - ensure public routes work
- **Session**: NextAuth uses database sessions, not JWT
- **Uploads**: Currently local files - implement cloud storage for production
- **Real-time**: Socket.IO setup not yet complete
- **Email**: Resend requires domain verification for production

---

## 🌟 Demo Flow (Once Complete)

1. **Donor signs up** → Fills form → Uploads docs → Waits for verification
2. **Recipient signs up** → Fills form → Hospital verifies medical need
3. **System matches** → Based on compatibility
4. **Hospital reviews** → Approves/rejects match
5. **Both parties accept** → Chat unlocked
6. **PDF generated** → Downloadable consent
7. **Procedure scheduled** → Hospital coordinates
8. **Donation complete** → System updated

---

## 📈 Scalability Considerations

For production/large scale:
- Add Redis for caching
- Use cloud storage (S3/Cloudflare R2) for files
- Implement rate limiting
- Add CDN for static assets
- Database read replicas
- Monitoring (Sentry, LogRocket)
- Kubernetes for auto-scaling

---

**Built for Cosmohack 2025 🚀**

Need help? Check [SETUP.md](./SETUP.md) or README!
