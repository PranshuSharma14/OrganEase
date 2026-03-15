# Authentication Setup - Sign In & Sign Up Pages

## 🎨 Features Implemented

### ✅ Beautiful Sign In Page
Location: [src/app/auth/signin/page.tsx](src/app/auth/signin/page.tsx)

**Features:**
- ✨ Modern, responsive design with gradient backgrounds
- 🔐 Traditional email/password authentication
- 🔑 OAuth sign-in with Google
- 👤 Role selection (Donor, Recipient, Hospital Admin)
- 👁️ Password visibility toggle
- ⚠️ Form validation and error messages
- 📱 Mobile-friendly layout
- 🎯 Smooth animations and transitions

### ✅ Beautiful Sign Up Page
Location: [src/app/auth/signup/page.tsx](src/app/auth/signup/page.tsx)

**Features:**
- 🌟 Stunning role selection cards with feature highlights
- 📋 Comprehensive registration form:
  - Full Name
  - Email Address
  - Phone Number (optional)
  - Password with strength requirements
  - Confirm Password
- 🔒 Password confirmation matching
- 🔑 OAuth sign-up with Google
- ✅ Real-time form validation
- 📊 Trust indicators (stats display)
- 🎨 Role-specific color schemes

## 🛠️ Technical Implementation

### 1. Database Schema Updates
Added to [src/lib/db/schema.ts](src/lib/db/schema.ts):
```typescript
phone: text("phone"),        // Optional phone number
password: text("password"),  // Hashed password for credentials auth
```

### 2. Authentication Providers
Updated [src/auth.ts](src/auth.ts):
- ✅ Google OAuth provider
- ✅ Credentials provider with bcrypt password hashing
- ✅ Proper session and JWT handling
- ✅ Role management in sessions

### 3. API Route
Created [src/app/api/auth/signup/route.ts](src/app/api/auth/signup/route.ts):
- User registration endpoint
- Email validation
- Password hashing with bcrypt
- Duplicate email checking
- Role assignment

### 4. Database Migration
Created [drizzle/0001_add_credentials_auth.sql](drizzle/0001_add_credentials_auth.sql):
```sql
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password" text;
```

## 📦 Required Dependencies

Run this command to install the necessary packages:
```bash
npm install bcryptjs @types/bcryptjs
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install bcryptjs @types/bcryptjs
```

### 2. Run Database Migration
```bash
npm run db:push
# or
npm run db:migrate
```

### 3. Environment Variables
Make sure these are in your `.env` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
DATABASE_URL=your_database_url
```

### 4. Start Development Server
```bash
npm run dev
```

## 🎯 Usage

### Sign In
Navigate to: `http://localhost:3000/auth/signin`

Users can:
1. Select their role (Donor/Recipient/Hospital)
2. Sign in with email + password
3. OR sign in with Google OAuth
4. Toggle password visibility
5. Access "Forgot Password" link

### Sign Up
Navigate to: `http://localhost:3000/auth/signup`

Users can:
1. Choose their role with visual cards
2. Fill in their details:
   - Full name (required)
   - Email (required)
   - Phone (optional)
   - Password (min 8 chars, required)
   - Confirm password (required)
3. Create account with credentials
4. OR sign up with Google OAuth
5. Automatic redirect to role-specific onboarding

## 🎨 Design Highlights

### Color Scheme
- **Donor**: Blue (`bg-blue-600`)
- **Recipient**: Red (`bg-red-600`)
- **Hospital**: Purple (`bg-purple-600`)

### UI Components Used
- Shadcn/ui components (Button, Card, Input, Label)
- Lucide React icons
- Responsive grid layouts
- Form validation feedback
- Loading states with spinners

### Responsive Design
- Desktop: Side-by-side branding and forms
- Tablet: Stacked layout with proper spacing
- Mobile: Single column, optimized touch targets

## 🔐 Security Features

1. **Password Requirements**:
   - Minimum 8 characters
   - Hashed with bcrypt (10 salt rounds)
   - Secure storage in database

2. **Email Validation**:
   - Regex pattern validation
   - Duplicate email prevention
   - Format verification

3. **Session Management**:
   - JWT-based sessions
   - Secure token handling
   - Role-based access control

4. **Error Handling**:
   - User-friendly error messages
   - No sensitive information leaks
   - Proper status codes

## 📱 User Flow

### New User Registration
```
Visit /auth/signup 
→ Select Role 
→ Fill Form 
→ Submit 
→ Auto Sign In 
→ Redirect to /onboarding/{role}
```

### Existing User Sign In
```
Visit /auth/signin 
→ Select Role 
→ Enter Credentials 
→ Sign In 
→ Redirect to /dashboard/{role}
```

### OAuth Flow
```
Click "Sign in/up with Google" 
→ Google Auth 
→ Callback 
→ Create/Update User 
→ Redirect to appropriate page
```

## 🐛 Error Handling

The forms handle these scenarios:
- Missing required fields
- Invalid email format
- Password too short
- Passwords don't match
- Email already exists
- Network errors
- Authentication failures

## 🎉 Next Steps

Consider adding:
1. Email verification flow
2. Password reset functionality
3. Two-factor authentication (2FA)
4. Social login (GitHub, Facebook, etc.)
5. Remember me checkbox
6. Password strength indicator
7. CAPTCHA for bot prevention

## 📝 Notes

- OAuth users don't need to set passwords
- Phone numbers are optional for all users
- User role is permanent once set during registration
- All passwords are hashed and never stored in plain text
- Sessions expire based on NextAuth configuration

---

**Created by**: GitHub Copilot  
**Date**: December 19, 2025  
**Status**: ✅ Ready for Use
