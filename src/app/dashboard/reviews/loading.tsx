import { Skeleton } from "@/components/skeleton";

export default function ReviewsLoading() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
