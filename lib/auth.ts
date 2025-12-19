import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  debug: true,
  adapter: PrismaAdapter(prisma),
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
    async session({ session, user, token }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! }
        });
        if (dbUser) {
          (session.user as any).role = dbUser.role;
          (session.user as any).id = dbUser.id;
        }
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      // Auto-promote specific admin email
      if (user.email === "akshatjaiswal875@gmail.com") {
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
