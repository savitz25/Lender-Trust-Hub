/** Lightweight placeholder while FDIC explorer client bundle loads */
export function ExplorerSkeleton() {
  return (
    <div className="animate-pulse space-y-8 px-4 py-12" aria-hidden="true">
      <div className="mx-auto h-32 max-w-4xl rounded-2xl bg-zinc-200" />
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-zinc-200" />
        ))}
      </div>
      <div className="mx-auto h-96 max-w-7xl rounded-2xl bg-zinc-200" />
    </div>
  );
}