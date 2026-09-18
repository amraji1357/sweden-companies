import Link from "next/link";
import AuthButtons from "@/app/components/AuthButtons";
import { db } from "@/src/prisma/db";
import { getSessionUserId } from "@/src/lib/auth";

type HomeProps = {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    category?: string;
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

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  const search =
    typeof params.search === "string"
      ? params.search.trim().toLowerCase()
      : "";

  const sort =
    typeof params.sort === "string" ? params.sort : "rating";

  const selectedCategory =
    typeof params.category === "string"
      ? params.category.trim().toLowerCase()
      : "";

  const [companies, categories, sessionUserId] = await Promise.all([
    db.orm.public.Company
      .include("categories", (categories) =>
        categories.include("category")
      )
      .all(),

    db.orm.public.Category
      .orderBy((category) => category.name.asc())
      .all(),

    getSessionUserId(),
  ]);

  const currentUser = sessionUserId
    ? await db.orm.public.User
        .where({ id: sessionUserId })
        .first()
    : null;

  const ratingStats = await db.orm.public.Rating
    .groupBy("companyId")
    .aggregate((agg) => ({
      average: agg.avg("score"),
      count: agg.count(),
    }));

  const statsByCompany = new Map(
    ratingStats.map((item) => [
      item.companyId,
      {
        average: Number(item.average ?? 0),
        count: item.count,
      },
    ])
  );

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = !search
      ? true
      : [
          company.name,
          company.city ?? "",
          company.description ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);

    const matchesCategory = !selectedCategory
      ? true
      : company.categories.some(
          (companyCategory) =>
            companyCategory.category.slug === selectedCategory
        );

    return matchesSearch && matchesCategory;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    const aStats = statsByCompany.get(a.id) ?? {
      average: 0,
      count: 0,
    };

    const bStats = statsByCompany.get(b.id) ?? {
      average: 0,
      count: 0,
    };

    if (sort === "name-asc") {
      return a.name.localeCompare(b.name);
    }

    if (sort === "name-desc") {
      return b.name.localeCompare(a.name);
    }

    if (sort === "reviews") {
      if (bStats.count !== aStats.count) {
        return bStats.count - aStats.count;
      }

      return bStats.average - aStats.average;
    }

    if (bStats.average !== aStats.average) {
      return bStats.average - aStats.average;
    }

    return bStats.count - aStats.count;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <header className="flex justify-end">
            <AuthButtons
              user={
                currentUser
                  ? {
                      name: currentUser.name,
                      username: currentUser.username,
                      email: currentUser.email,
                    }
                  : null
              }
            />
          </header>

          <div className="py-16">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-blue-400">
              Sweden Companies
            </p>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Discover and rate companies in Sweden.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Explore Swedish companies, compare their ratings, and read
              reviews from users.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">
            Company ranking
          </h2>

          <p className="mt-2 text-slate-400">
            {filteredCompanies.length} compan
            {filteredCompanies.length === 1 ? "y" : "ies"} found
          </p>
        </div>

        <form
          method="GET"
          className="mb-8 flex flex-col gap-3 lg:flex-row"
        >
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search companies..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
          />

          <select
            name="category"
            defaultValue={selectedCategory}
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
          >
            <option value="">All categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
          >
            <option value="rating">Highest rated</option>
            <option value="reviews">Most reviewed</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold transition hover:bg-blue-400"
          >
            Filter
          </button>
        </form>

        {sortedCompanies.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            No companies match your filters.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedCompanies.map((company, index) => {
              const stats = statsByCompany.get(company.id) ?? {
                average: 0,
                count: 0,
              };

              const hasRating = stats.count > 0;

              return (
                <Link
                  key={company.id}
                  href={`/company/${company.slug}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-blue-400/40 hover:bg-white/[0.08]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-xl font-bold text-blue-400">
                      {company.name.charAt(0).toUpperCase()}
                    </div>

                    {sort === "rating" && hasRating && (
                      <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    {company.name}
                  </h3>

                  {company.city && (
                    <p className="mt-2 text-sm text-slate-500">
                      {company.city}, {company.country}
                    </p>
                  )}

                  <div className="mt-4">
                    {hasRating ? (
                      <>
                        <Stars rating={stats.average} />

                        <p className="mt-1 text-xs text-slate-500">
                          {stats.count} rating
                          {stats.count === 1 ? "" : "s"}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No ratings yet
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {company.categories.map((companyCategory) => (
                      <span
                        key={companyCategory.categoryId}
                        className="rounded-full bg-blue-400/10 px-3 py-1 text-xs text-blue-300"
                      >
                        {companyCategory.category.name}
                      </span>
                    ))}
                  </div>

                  {company.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                      {company.description}
                    </p>
                  )}

                  <div className="mt-6 text-sm font-medium text-blue-400">
                    View company →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
