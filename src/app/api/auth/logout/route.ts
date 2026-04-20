import { SESSION_COOKIE } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Гарлаа." });

  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}
