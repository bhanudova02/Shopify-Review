import Link from "next/link";

const GRAPHQL_URL = "https://cwytui-ah.myshopify.com/admin/api/2024-01/graphql.json";

function getShopifyAccessToken() {
  return process.env.SHOPIFY_ACCESS_TOKEN || "";
}

async function getDashboardMetrics() {
  const query = `
    query GetReviewMetaobjects {
      metaobjects(type: "review", first: 250) {
        nodes {
          fields {
            key
            value
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": getShopifyAccessToken(),
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const json = (await response.json()) as any;
    const nodes = json.data?.metaobjects?.nodes || [];

    let totalRating = 0;
    let totalReviews = nodes.length;
    let pendingResponses = 0;
    let ratedReviews = 0;

    nodes.forEach((node: any) => {
      const getFieldValue = (key: string) => {
        const fields = Array.isArray(node.fields) ? node.fields : [];
        const matched = fields.find(
          (field: any) => String(field?.key || "").toLowerCase().trim() === key.toLowerCase().trim()
        );
        return matched?.value ?? null;
      };

      const ratingStr = getFieldValue("rating");
      const approvedValue = (getFieldValue("approved") || getFieldValue("Approved") || "").toLowerCase();
      
      const rating = Number(ratingStr);
      if (!isNaN(rating) && rating > 0) {
        totalRating += rating;
        ratedReviews++;
      }

      if (approvedValue !== "true") {
        pendingResponses++;
      }
    });

    const averageRating = ratedReviews > 0 ? (totalRating / ratedReviews).toFixed(1) : "0.0";

    return {
      totalReviews: totalReviews.toString(),
      averageRating: averageRating,
      pendingResponses: pendingResponses.toString(),
    };
  } catch (error) {
    return null;
  }
}

export default async function DashboardOverviewPage() {
  const metrics = await getDashboardMetrics();

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">Overview</h1>
        <p className="mt-1 text-zinc-600">Shopify review metrics at a glance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm text-zinc-500">Total Reviews</h2>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{metrics?.totalReviews ?? "--"}</p>
        </article>
        
        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm text-zinc-500">Average Rating</h2>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{metrics?.averageRating ?? "--"}</p>
        </article>
        
        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm text-zinc-500">Pending Responses</h2>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{metrics?.pendingResponses ?? "--"}</p>
        </article>
      </div>

      <div>
        <Link
          href="/dashboard/reviews"
          className="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "#d43211" }}
        >
          View Reviews
        </Link>
      </div>
    </section>
  );
}
