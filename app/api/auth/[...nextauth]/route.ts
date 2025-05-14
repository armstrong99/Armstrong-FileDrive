import NextAuth, { NextAuthOptions, Session } from "next-auth";
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
        timeout: 10000, // 10 seconds
      },
    }),
  ],
  session: {
    strategy: "jwt", // Adapter not needed for JWT
    maxAge: 60 * 60,
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) throw new Error("No email found");
      console.log("Profile", profile);
      // Your existing manual upsert
      await prisma.user.upsert({
        where: { email: profile.email },
        update: { fullName: profile.name! },
        create: {
          email: profile.email,
          fullName: profile.name!,
          password: "", // Empty for OAuth users
          imageUrl: profile.image || "",
        },
      });
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // From Prisma user
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

const handler = NextAuth(nextAuthOptions);
export { handler as GET, handler as POST };
