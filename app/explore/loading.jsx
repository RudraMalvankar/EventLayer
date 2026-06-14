export default function ExploreLoading() {
  return (
    <main className="min-h-screen text-white pb-24">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-16 animate-pulse">
          <div className="h-6 w-20 rounded-full bg-white/5 mb-4" />
          <div className="h-12 w-64 rounded-lg bg-white/5 mb-4" />
          <div className="h-5 w-96 rounded bg-white/5 mb-10" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5 h-14 rounded-2xl bg-white/5" />
            <div className="md:col-span-2 h-14 rounded-2xl bg-white/5" />
            <div className="md:col-span-2 h-14 rounded-2xl bg-white/5" />
            <div className="md:col-span-2 h-14 rounded-2xl bg-white/5" />
            <div className="md:col-span-1 h-14 rounded-2xl bg-white/5" />
          </div>
          <div className="mt-8 h-52 w-full rounded-[24px] bg-white/5" />
        </div>
        <div className="flex items-center justify-center py-24 text-gray-500">
          Loading explore feed...
        </div>
      </div>
    </main>
  );
}