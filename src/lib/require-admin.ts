import { getSessionUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Нэвтрээгүй байна." },
        { status: 401 },
      ),
    };
  }

  if (sessionUser.role !== "ADMIN") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Админ эрх шаардлагатай." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    user: sessionUser,
  };
}
