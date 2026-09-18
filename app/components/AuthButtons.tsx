"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthUser = {
  name: string | null;
  username: string | null;
  email: string;
};

export default function AuthButtons({
  user,
}: {
  user: AuthUser | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-xl px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Sign in
        </Link>

        <Link
          href="/register"
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold transition hover:bg-blue-400"
        >
          Create account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-white">
          {user.name || user.username || "User"}
        </p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </div>

      <button
        onClick={handleLogout}
        disabled={loading}
        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
      >
        {loading ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
