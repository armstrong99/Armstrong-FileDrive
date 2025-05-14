// app/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/app/lib/prismadb";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) throw new Error("No email found");
      await prisma.user.upsert({
        where: { email: profile.email },
        update: { fullName: profile.name! },
        create: {
          email: profile.email,
          fullName: profile.name!,
          password: "",
          imageUrl: profile.image || "",
        },
      });
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user!.id = token.id as string;
      session.user!.email = token.email as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
