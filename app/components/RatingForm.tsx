"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RatingFormProps = {
  companyId: number;
  isLoggedIn: boolean;
  currentRating: number | null;
};

export default function RatingForm({
  companyId,
  isLoggedIn,
  currentRating,
}: RatingFormProps) {
  const router = useRouter();

  const [selected, setSelected] = useState(currentRating ?? 0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitRating(score: number) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setSelected(score);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          score,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not save rating");
        return;
      }

      setMessage("Rating saved.");
      router.refresh();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-6">
      <h2 className="text-lg font-semibold">
        {currentRating ? "Your rating" : "Rate this company"}
      </h2>

      <div className="mt-4 flex items-center gap-2">
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;

          return (
            <button
              key={value}
              type="button"
              onClick={() => submitRating(value)}
              disabled={loading}
              aria-label={`Rate ${value} out of 5`}
              className={`text-3xl transition ${
                value <= selected
                  ? "text-yellow-400"
                  : "text-slate-600 hover:text-yellow-300"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              ★
            </button>
          );
        })}
      </div>

      {!isLoggedIn && (
        <p className="mt-3 text-sm text-slate-500">
          Sign in to rate this company.
        </p>
      )}

      {message && (
        <p className="mt-3 text-sm text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}
