import ReviewForm from "@/app/components/ReviewForm";
import { notFound } from "next/navigation";
import { db } from "@/src/prisma/db";
import { getSessionUserId } from "@/src/lib/auth";
import RatingForm from "@/app/components/RatingForm";

type CompanyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function Stars({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-2">
      <span className="tracking-wider text-yellow-400">
        {"★".repeat(rounded)}
        <span className="text-slate-600">
          {"★".repeat(5 - rounded)}
        </span>
      </span>

      <span className="text-sm text-slate-400">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default async function CompanyPage({
  params,
}: CompanyPageProps) {
  const { slug } = await params;

  const sessionUserId = await getSessionUserId();

  const company = await db.orm.public.Company
    .where({ slug })
    .include("reviews", (reviews) =>
      reviews
        .include("user")
        .orderBy((review) => review.createdAt.desc())
    )
    .first();

  if (!company) {
    notFound();
  }

  const currentRating = sessionUserId
    ? await db.orm.public.Rating
        .where({
          companyId: company.id,
          userId: sessionUserId,
        })
        .first()
    : null;

  const ratingStats = await db.orm.public.Rating
    .where({ companyId: company.id })
    .aggregate((agg) => ({
      average: agg.avg("score"),
      count: agg.count(),
    }));

  const averageRating = Number(ratingStats.average ?? 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <a
          href="/"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to companies
        </a>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl font-bold text-blue-400">
              {company.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-4xl font-bold">{company.name}</h1>

              {company.city && (
                <p className="mt-2 text-slate-500">
                  {company.city}, {company.country}
                </p>
              )}

              <div className="mt-4">
                {ratingStats.count > 0 ? (
                  <div>
                    <Stars rating={averageRating} />

                    <p className="mt-1 text-sm text-slate-500">
                      {ratingStats.count} rating
                      {ratingStats.count === 1 ? "" : "s"}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No ratings yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {company.description && (
            <p className="mt-8 max-w-3xl leading-7 text-slate-400">
              {company.description}
            </p>
          )}

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Visit website →
            </a>
          )}

          <RatingForm
            companyId={company.id}
            isLoggedIn={Boolean(sessionUserId)}
            currentRating={currentRating?.score ?? null}
          />
<ReviewForm
  companyId={company.id}
  isLoggedIn={Boolean(sessionUserId)}
/>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Reviews</h2>

          {company.reviews.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-400">
              No reviews yet.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {company.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {review.title || "Review"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        by{" "}
                        {review.user.name ||
                          review.user.username ||
                          "Anonymous"}
                      </p>
                    </div>

                    <time className="text-xs text-slate-600">
                      {new Date(
                        review.createdAt
                      ).toLocaleDateString()}
                    </time>
                  </div>

                  <p className="mt-4 leading-7 text-slate-400">
                    {review.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
