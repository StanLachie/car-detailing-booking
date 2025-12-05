import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE_MB,
} from "@/lib/config";

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and videos are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "bin";
    const filename = `bookings/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    return NextResponse.json({
      url: blob.url,
      type: isVideo ? "video" : "image",
      name: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
