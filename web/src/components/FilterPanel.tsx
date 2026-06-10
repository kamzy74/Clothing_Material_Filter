"use client";

import { Search, SlidersHorizontal } from "lucide-react";

export interface Filters {
  search: string;
  category: string;
  minNatural: number;
  fiber: string;
  retailer: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Sweaters", "Fleece", "Clothing"];
const RETAILERS = ["All", "Pact", "Patagonia", "Everlane"];
const NATURAL_FIBERS = [
  "All",
  "cotton",
  "wool",
  "linen",
  "silk",
  "hemp",
  "cashmere",
  "alpaca",
  "bamboo",
  "tencel",
];

export default function FilterPanel({ filters, onChange }: Props) {
  const set = (key: keyof Filters, value: string | number) =>
    onChange({ ...filters, [key]: value });

  return (
    <aside className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="e.g. linen shirt"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Min natural % slider */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Min. natural fibers
          <span className="ml-2 font-bold text-emerald-700">{filters.minNatural}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={filters.minNatural}
          onChange={(e) => set("minNatural", parseInt(e.target.value))}
          className="w-full accent-amber-600"
        />
        <div className="flex justify-between text-xs text-stone-400">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => set("category", c === "All" ? "" : c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (c === "All" && !filters.category) || filters.category === c
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Fiber type */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Fiber type
        </label>
        <div className="flex flex-wrap gap-2">
          {NATURAL_FIBERS.map((f) => (
            <button
              key={f}
              onClick={() => set("fiber", f === "All" ? "" : f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (f === "All" && !filters.fiber) || filters.fiber === f
                  ? "bg-stone-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Retailer */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Retailer
        </label>
        <div className="flex flex-wrap gap-2">
          {RETAILERS.map((r) => (
            <button
              key={r}
              onClick={() => set("retailer", r === "All" ? "" : r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (r === "All" && !filters.retailer) || filters.retailer === r
                  ? "bg-stone-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-stone-400">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        All products shown have ≥60% natural fibers
      </div>
    </aside>
  );
}
