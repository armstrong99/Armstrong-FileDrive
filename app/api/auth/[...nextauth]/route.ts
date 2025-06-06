// app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";
import NextAuth from "next-auth";
import { nextAuthOptions } from "@/app/lib/auth";

const handler = NextAuth(nextAuthOptions);
export { handler as GET, handler as POST };
