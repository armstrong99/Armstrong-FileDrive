// app/api/users/[id]/resources/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prismadb";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const session = await getServerSession(nextAuthOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3️⃣ Lookup user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Fetch all folders and files owned by this user
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.file.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json([...folders, ...files]);
  } catch (err) {
    console.error("Error fetching resources for user", user.id, err);
    return NextResponse.json(
      { error: "Could not load resources" },
      { status: 500 }
    );
  }
}
