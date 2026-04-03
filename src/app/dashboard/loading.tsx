import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="h-10 w-36" />
    </section>
  );
}
