import Link from "next/link";

export default async function DashboardOverviewPage() {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">Overview</h1>
        <p className="mt-1 text-zinc-600">Shopify review metrics at a glance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Total Reviews", "Average Rating", "Pending Responses"].map((title) => (
          <article key={title} className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-sm text-zinc-500">{title}</h2>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">--</p>
          </article>
        ))}
      </div>

      <div>
        <Link
          href="/dashboard/reviews"
          className="primary-button inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold"
        >
          View Reviews
        </Link>
      </div>
    </section>
  );
}
