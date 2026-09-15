import React from 'react';

// ─── Generic Skeleton ─────────────────────────────────────────────────────────
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const ProductCardSkeleton = () => (
  <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm animate-pulse flex flex-col">
    <div className="h-52 bg-slate-200" />
    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded-md w-3/4" />
        <div className="h-3 bg-slate-100 rounded-md w-full" />
        <div className="h-3 bg-slate-100 rounded-md w-2/3" />
      </div>
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-5 bg-slate-200 rounded w-20" />
        </div>
        <div className="h-9 bg-slate-200 rounded-xl w-full" />
      </div>
    </div>
  </div>
);

export const TableRowSkeleton = ({ columns = 8 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-3">
        <div className="h-4 bg-slate-200 rounded w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export const MetricCardSkeleton = () => (
  <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-sm animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-2xl bg-slate-200" />
      <div className="w-16 h-4 bg-slate-200 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="w-24 h-3 bg-slate-200 rounded" />
      <div className="w-32 h-6 bg-slate-200 rounded" />
    </div>
  </div>
);
