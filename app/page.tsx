// app/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { nextAuthOptions } from "./lib/auth";

export default async function Home() {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    redirect("/auth");
  } else {
    redirect("/dashboard");
  }

  // This won't actually render since we redirect above
  return null;
}
