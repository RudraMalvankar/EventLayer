export default function EventsLoading() {
  return (
    <main className="min-h-screen text-white pb-24">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-20 animate-pulse">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <div className="h-6 w-32 rounded-full bg-white/5 mb-4" />
              <div className="h-12 w-64 rounded-lg bg-white/5 mb-4" />
              <div className="h-5 w-80 rounded bg-white/5" />
            </div>
            <div className="h-10 w-48 rounded-full bg-white/5" />
          </div>
          <div className="h-12 w-full rounded-2xl bg-white/5 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-12">
            <div className="md:col-span-4 h-14 rounded-2xl bg-white/5" />
            <div className="md:col-span-4 h-14 rounded-2xl bg-white/5" />
            <div className="md:col-span-4 h-14 rounded-2xl bg-white/5" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="min-w-[70px] h-24 rounded-[24px] bg-white/5" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 py-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-[32px] bg-white/5 overflow-hidden">
              <div className="aspect-[16/10] bg-white/5" />
              <div className="p-7 space-y-4">
                <div className="h-3 w-24 rounded bg-white/5" />
                <div className="h-3 w-16 rounded bg-white/5" />
                <div className="h-5 w-full rounded bg-white/5" />
                <div className="h-16 w-full rounded-2xl bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}