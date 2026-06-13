"use client";

export function EventSkeleton() {
  return (
    <div className="bg-white/5 rounded-[32px] p-6 border border-white/5 animate-pulse">
      <div className="w-full h-48 bg-white/10 rounded-[24px] mb-6" />
      <div className="space-y-4">
        <div className="h-6 bg-white/10 rounded-full w-3/4" />
        <div className="h-4 bg-white/10 rounded-full w-1/2" />
        <div className="flex gap-2 pt-4">
          <div className="h-6 bg-white/10 rounded-full w-20" />
          <div className="h-6 bg-white/10 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}