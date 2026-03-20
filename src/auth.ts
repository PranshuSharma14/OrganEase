import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any, request: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        } as any;
      },
    }),
  ],
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger }: { token: any; user: any; trigger?: string }) {
      // Permanent admin email
      const ADMIN_EMAIL = "pranshusharmaindia@gmail.com";

      if (user?.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id as string),
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.email === ADMIN_EMAIL ? "admin" : dbUser.role;
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      } else if (token.id && trigger === "update") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });

        if (dbUser) {
          token.role = dbUser.email === ADMIN_EMAIL ? "admin" : dbUser.role;
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      }

      // Always enforce admin for this email
      if (token.email === ADMIN_EMAIL) {
        token.role = "admin";
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async signIn({ user }: { user: any }) {
      // Auto-promote admin email in DB on every sign-in
      const ADMIN_EMAIL = "pranshusharmaindia@gmail.com";
      if (user?.email === ADMIN_EMAIL) {
        try {
          await db.update(users).set({ role: "admin" }).where(eq(users.email, ADMIN_EMAIL));
        } catch (e) {
          console.error("Failed to auto-promote admin:", e);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions as any);
