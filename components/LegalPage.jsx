export function LegalPage({
  eyebrow,
  title,
  description,
  lastUpdated,
  children,
}) {
  return (
    <article className="rounded-[32px] border border-white/10 bg-[#0a0c12]/90 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
      <div className="space-y-5">
        <div className="inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
          {eyebrow}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
              {description}
            </p>
          </div>

          {lastUpdated ? (
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
              Last updated:{" "}
              <span className="text-orange-400">{lastUpdated}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-10 space-y-8">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/5 p-5 sm:p-6">
      <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-400 sm:text-base">
        {children}
      </div>
    </section>
  );
}
