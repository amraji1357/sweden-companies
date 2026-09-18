"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ReviewFormProps = {
  companyId: number;
  isLoggedIn: boolean;
};

export default function ReviewForm({
  companyId,
  isLoggedIn,
}: ReviewFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          title,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not save review");
        return;
      }

      setTitle("");
      setContent("");
      setMessage("Review posted successfully.");
      router.refresh();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-6">
      <h2 className="text-lg font-semibold">Write a review</h2>

      {!isLoggedIn ? (
        <p className="mt-3 text-sm text-slate-500">
          Sign in to write a review.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Review title (optional)"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400"
          />

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share your experience..."
            required
            minLength={5}
            rows={5}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-500 px-5 py-3 font-semibold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post review"}
          </button>

          {message && (
            <p className="text-sm text-slate-400">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
