import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Extend the Session type to include 'mobile'
import { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      emailVerified?: Date | null;
      image: string | null;
      role: string;
      mobile?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  debug: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // For testing without Google keys
    CredentialsProvider({
      name: "Guest Login (Dev)",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "student@college.edu" },
        role: { label: "Role", type: "text", placeholder: "STUDENT or ADMIN" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // Check if user exists, if not create one for testing
        let user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
              role: credentials.role || "STUDENT",
            }
          });
        }

        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign in, add user data to the token
      if (user) {
        token.id = user.id;
        token.role = (user as typeof user & { role?: string }).role || "STUDENT";
        token.mobile = (user as typeof user & { mobile?: string | null }).mobile ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = (token.role as string) || "STUDENT";
          session.user.mobile = (token.mobile as string | null) ?? null;
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      // Auto-promote specific admin emails
      const adminEmails = [
        "akshatjaiswal875@gmail.com", 
        "madankarmayank08@gmail.com", 
        "balkrishana26@gmail.com"
      ];
      
      if (user.email && adminEmails.includes(user.email)) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: "ADMIN" }
          });
        } catch (e) {
          console.error("Failed to promote admin", e);
        }
      }

      // Log the visit
      try {
        if (user.id) {
          await prisma.visitLog.create({
            data: {
              userId: user.id,
              page: "LOGIN"
            }
          });
        }
      } catch (e) {
        console.error("Failed to log visit", e);
      }
    }
  }
};
