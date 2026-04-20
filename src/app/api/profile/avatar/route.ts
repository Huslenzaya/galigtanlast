import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function getFileExtension(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return ext;
  }

  return ".png";
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Profile avatar upload route ажиллаж байна. Зураг upload хийхдээ POST ашиглана.",
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const userId = String(formData.get("userId") || "").trim();
    const file = formData.get("avatar");

    if (!userId) {
      return NextResponse.json(
        { message: "userId шаардлагатай." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Зураг файл шаардлагатай." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Зөвхөн зураг файл оруулна уу." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Зураг 2MB-аас ихгүй байх ёстой." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Хэрэглэгч олдсонгүй." },
        { status: 404 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const ext = getFileExtension(file.name);
    const fileName = `${userId}-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      message: "Профайлын зураг шинэчлэгдлээ.",
      avatarUrl: updatedUser.avatarUrl,
    });
  } catch (error) {
    console.error("POST /api/profile/avatar error:", error);

    return NextResponse.json(
      { message: "Профайлын зураг хадгалахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
