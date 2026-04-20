"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  xp: number;
  streak: number;
  level: number;
  createdAt: string;
}

function roleLabel(role: AdminUser["role"]) {
  return role === "ADMIN" ? "Админ" : "Сурагч";
}

export function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  async function parseError(res: Response, fallback: string) {
    try {
      const data = await res.json();
      return data?.message || fallback;
    } catch {
      return fallback;
    }
  }

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users", { cache: "no-store" });

      if (!res.ok) {
        throw new Error(
          await parseError(res, "Хэрэглэгчдийг ачаалж чадсангүй."),
        );
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setErrorMsg("");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="bg-white border-2 border-paper-100 rounded-2xl overflow-hidden">
      <div className="p-5 border-b-2 border-paper-100 flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-black">Хэрэглэгчдийн жагсаалт</h3>
          <p className="text-[12px] text-ink-muted font-semibold mt-1">
            Системд бүртгэгдсэн сурагч, админ хэрэглэгчид
          </p>
        </div>
        <span className="text-[12px] font-bold text-ink-muted">
          {loading ? "..." : `${users.length} хэрэглэгч`}
        </span>
      </div>

      {errorMsg && (
        <div className="m-4 bg-ember-50 border-2 border-ember-100 text-ember-300 rounded-2xl px-4 py-3 text-[13px] font-bold">
          {errorMsg}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b-2 border-paper-100">
            <tr>
              {[
                "Нэр",
                "И-мэйл",
                "Эрх",
                "Түвшин",
                "XP",
                "Дараалал",
                "Нэгдсэн",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[11px] font-extrabold text-ink-muted uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!loading && users.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[13px] text-ink-muted font-semibold">
                  Хэрэглэгч алга байна.
                </td>
              </tr>
            )}

            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-paper-50 hover:bg-paper-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-200 to-grass-200 flex items-center justify-center text-[12px] font-black text-white">
                      {u.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="font-bold">{u.name}</span>
                  </div>
                </td>

                <td className="px-4 py-3 text-ink-muted text-[12px]">
                  {u.email}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-[11px] font-extrabold px-2 py-0.5 rounded-lg",
                      u.role === "ADMIN"
                        ? "bg-ember-50 text-ember-300"
                        : "bg-sky-50 text-sky-300",
                    )}>
                    {roleLabel(u.role)}
                  </span>
                </td>

                <td className="px-4 py-3 font-bold">{u.level}</td>
                <td className="px-4 py-3 font-bold text-grass-300">{u.xp}</td>
                <td className="px-4 py-3 font-bold">{u.streak}</td>
                <td className="px-4 py-3 text-ink-muted text-[11px]">
                  {new Date(u.createdAt).toLocaleDateString("mn-MN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
