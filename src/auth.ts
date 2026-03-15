import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, donorProfiles, recipientProfiles, hospitalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Dynamically import bcrypt to avoid errors if not installed
let bcrypt: any;
try {
  bcrypt = require("bcryptjs");
} catch (e) {
  console.warn("bcryptjs not installed - credential auth will be disabled");
}

export const authOptions = {
  adapter: DrizzleAdapter(db) as any,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    ...(bcrypt
      ? [
          Credentials({
            name: "Credentials",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                return null;
              }

              const user = await db.query.users.findFirst({
                where: eq(users.email, credentials.email as string),
              });

              if (!user) {
                return null;
              }

              // Handle accounts created through onboarding (no password)
              if (!user.password && credentials.password === "onboarding-account") {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                  image: user.image,
                };
              }

              // Handle accounts with passwords
              if (!user.password) {
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
                role: user.role,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id as string),
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      } else if (token.id && trigger === "update") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions as any);
