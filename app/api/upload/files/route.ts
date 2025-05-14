export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/app/lib/prismadb";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/app/lib/auth";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const session = await getServerSession(nextAuthOptions);
  if (!(session as any)?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse formData
  const formData = await request.formData();
  const rawNodes = formData.get("fileNodes") as string;
  const files = formData.getAll("files") as File[];

  if (!rawNodes) {
    return NextResponse.json({ error: "Missing fileNodes" }, { status: 400 });
  }

  let fileNodes: Array<{
    name: string;
    type: "file";
    fileSize: number;
    file: null;
    relativePath: string;
  }>;

  try {
    fileNodes = JSON.parse(rawNodes);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON for fileNodes" },
      { status: 400 }
    );
  }

  if (files.length !== fileNodes.length) {
    return NextResponse.json(
      { error: "files and fileNodes count mismatch" },
      { status: 400 }
    );
  }

  // 3. Lookup user
  const foundUser = await prisma.user.findUnique({
    where: { email: (session as any).user.email! },
  });
  if (!foundUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const uploadedFiles = [];

  // 4. Loop over each node + file in parallel
  for (let i = 0; i < fileNodes.length; i++) {
    const node = fileNodes[i];
    const file = files[i];

    // Sanity check
    if (file.name !== node.name) {
      return NextResponse.json(
        { error: `Filename mismatch at index ${i}` },
        { status: 400 }
      );
    }

    // Build exact S3 key: uploads/{userId}{relativePath}
    if (node.relativePath === "/") {
      node.relativePath = "";
    }
    const s3Key = `uploads/${foundUser.id}/${node.relativePath}/${node.name}`
      .replace(/\/+/g, "/") // Replace multiple consecutive slashes with single slash
      .replace(/\/$/, ""); // Remove trailing slash if any
    console.log(s3Key);

    const fileUpload = Buffer.from(await file.arrayBuffer());
    // 5. Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileUpload,
        ContentType: file.type,
      })
    );

    // 6. Persist metadata in MongoDB
    const dbFile = await prisma.file.create({
      data: {
        name: node.name,
        type: node.type,
        relativePath: node.relativePath,
        fileSize: node.fileSize,
        file: s3Key,
        ownerId: foundUser.id,
      },
    });

    console.log(dbFile);
    uploadedFiles.push(dbFile);
  }

  // 7. Return success + all records
  return NextResponse.json({ success: true, files: uploadedFiles });
}
