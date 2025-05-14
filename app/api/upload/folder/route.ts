export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/app/lib/prismadb";
import { getServerSession } from "next-auth";
import { FolderNode } from "@/app/lib/folderTreeAlgo";
import { InputJsonObject } from "@prisma/client/runtime/library";
import { nextAuthOptions } from "@/app/lib/auth";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(nextAuthOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const rawFolder = formData.get("folderNode") as string;
  const rawPaths = formData.get("filePaths") as string;
  const files = formData.getAll("files") as File[];

  if (!rawFolder || !rawPaths) {
    console.log("Missing folderNode or filePaths");
    return NextResponse.json(
      { error: "Missing folderNode or filePaths" },
      { status: 400 }
    );
  }

  let folderNode: FolderNode;
  let filePaths: string[];
  try {
    folderNode = JSON.parse(rawFolder);
    filePaths = JSON.parse(rawPaths);
  } catch {
    console.log("Invalid JSON payload");
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (filePaths.length !== files.length) {
    console.log("filePaths length must match number of files");
    return NextResponse.json(
      { error: "filePaths length must match number of files" },
      { status: 400 }
    );
  }

  // 3️⃣ Lookup user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relPath = filePaths[i].replace(/\/+/g, "/").replace(/\/$/, ""); // Remove trailing slash if any
    const s3Key = `uploads/${user.id}/${relPath}`;

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
      })
    );
  }

  const dbFolder = await prisma.folder.create({
    data: {
      name: folderNode.name,
      relativePath: folderNode.relativePath.replace(/^\/+|\/+$/g, ""),
      totalSize: folderNode.totalSize,
      type: folderNode.type,
      children: folderNode.children as InputJsonObject,
      ownerId: user.id,
    },
  });

  // 6️⃣ Return both
  return NextResponse.json({
    success: true,
    folder: dbFolder,
  });
}
