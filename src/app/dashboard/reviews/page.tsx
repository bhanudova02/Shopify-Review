"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/skeleton";

type ReviewMetaobject = {
  id: string;
  handle?: string;
  author?: string;
  rating?: number | string;
  content?: string;
  product_id?: string;
  product_handle?: string;
  product_image?: string | null;
  product_title?: string;
  status?: string;
  approved?: boolean;
  updatedAt?: string;
};

type ReviewsApiResponse = {
  reviews?: ReviewMetaobject[];
  error?: string;
};

function RatingStars({ rating }: { rating: number }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="whitespace-nowrap text-amber-500" aria-label={`Rating: ${safeRating} out of 5`}>
      {"★".repeat(safeRating)}
      <span className="text-zinc-300">{"★".repeat(5 - safeRating)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewMetaobject[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/reviews", { method: "GET" });
      const data = (await res.json()) as ReviewsApiResponse;

      if (!res.ok) {
        const err = data.error || "Failed to fetch reviews";
        throw new Error(err);
      }

      console.log("Frontend received:", data);
      setReviews(data.reviews || []);
    } catch (fetchError) {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const handleAction = async (id: string, action: "approve" | "disable") => {
    try {
      setProcessingId(id);

      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });

      const payload = (await response.json()) as
        | { success: boolean; review: ReviewMetaobject }
        | { error?: string };

      if (!response.ok || !("success" in payload) || !payload.success) {
        const err =
          "error" in payload && payload.error ? payload.error : `Failed to ${action} review`;
        throw new Error(err);
      }

      if (action === "approve") {
        toast.success("Review approved successfully!", { description: "Fetching latest data..." });
      } else {
        toast.info("Review disabled.");
      }
      
      await fetchReviews();
    } catch (actionError) {
      toast.error("Failed to update review", { description: "Please try again later." });
    } finally {
      setProcessingId(null);
    }
  };

  const tableRows = useMemo(() => {
    return reviews.map((review: any) => {
      const statusValue = String(review?.status || "pending").toLowerCase();
      const isDraft = statusValue === "draft";
      const displayStatus = isDraft
        ? "Draft"
        : review?.approved || statusValue === "active"
          ? "Approved"
          : review?.status || "pending";

      return {
        ...review,
        author: review?.author || "N/A",
        rating: Number(review?.rating || 0),
        content: review?.content || "N/A",
        productId: review?.product_id || "N/A",
        productHandle: review?.product_handle || "",
        productImage: review?.product_image || null,
        productTitle: review?.product_title || "Unknown Product",
        status: review?.status || "pending",
        approved: review?.approved || false,
        isDraft,
        displayStatus,
      };
    });
  }, [reviews]);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">Reviews</h1>
        <p className="mt-1 text-zinc-600">Manage and respond to customer reviews.</p>
      </header>

      {loading ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <Skeleton className="mb-4 h-8 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Content</th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {tableRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-500" colSpan={6}>
                    No reviews found.
                  </td>
                </tr>
              ) : (
                tableRows.map((entry) => (
                  <tr key={entry.id} className="align-top">
                    <td className="px-4 py-3 text-zinc-800">{entry.author}</td>
                    <td className="px-4 py-3">
                      <RatingStars rating={entry.rating} />
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-700">{entry.content}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      <div className="flex items-center gap-3">
                        {entry.productImage ? (
                          <div 
                            className="relative aspect-square h-10 w-10 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50"
                            title={entry.productTitle}
                          >
                            <img
                              src={entry.productImage}
                              alt={entry.productTitle || "Product"}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-square h-10 w-10 shrink-0 overflow-hidden rounded-md border border-zinc-200">
                            <Skeleton className="h-full w-full rounded-none" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{entry.productId}</span>
                          <div className="mt-0.5 flex items-center gap-2">
                            <a
                              href={
                                entry.productHandle
                                  ? `https://cwytui-ah.myshopify.com/products/${entry.productHandle}`
                                  : "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex max-w-[140px] items-center gap-1 hover:underline ${
                                entry.productTitle === "Unknown Product" ? "text-zinc-400" : "text-blue-600"
                              }`}
                              title={entry.productTitle}
                            >
                              <span className="truncate text-xs">{entry.productTitle}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </a>
                            {!entry.productImage && (
                              <button
                                type="button"
                                onClick={() => void fetchReviews()}
                                title="Refresh Data"
                                className="min-w-max rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-600 transition-colors hover:bg-zinc-100"
                              >
                                Refresh Data
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        {entry.displayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {entry.displayStatus === "Draft" ? (
                          <button
                            type="button"
                            disabled={processingId === entry.id}
                            onClick={() => void handleAction(entry.id, "approve")}
                            className="rounded-md px-3 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ backgroundColor: "#d43211" }}
                          >
                            {processingId === entry.id ? "Processing..." : "Approve"}
                          </button>
                        ) : entry.displayStatus === "Approved" ? (
                          <button
                            type="button"
                            disabled={processingId === entry.id}
                            onClick={() => void handleAction(entry.id, "disable")}
                            className="rounded-md bg-zinc-500 px-3 py-2 text-sm font-semibold text-white transition-opacity hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {processingId === entry.id ? "Processing..." : "Disable"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
