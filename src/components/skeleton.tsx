type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  const classes = "animate-pulse rounded-md bg-zinc-200 " + className;
  return <div className={classes} />;
}
