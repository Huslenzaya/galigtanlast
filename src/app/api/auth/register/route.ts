import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Нэр, и-мэйл, нууц үг бүгд заавал байна." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Нууц үг хамгийн багадаа 6 тэмдэгт байна." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Ийм и-мэйлтэй хэрэглэгч аль хэдийн байна." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const role = email === "admin@mongolbichig.mn" ? "ADMIN" : "STUDENT";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        xp: true,
        streak: true,
        level: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { message: "Бүртгэл үүсгэхэд алдаа гарлаа." },
      { status: 500 },
    );
  }
}
