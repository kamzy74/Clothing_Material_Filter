"use client";

// Shows a colored bar and text breakdown of the fiber composition.
// Like a matplotlib stacked bar chart — but rendered as HTML.

import type { FiberEntry } from "@/lib/materialParser";

interface Props {
  composition: FiberEntry[];
  naturalPct: number;
}

const FIBER_COLORS: Record<string, string> = {
  cotton: "#8B6914",
  "organic cotton": "#8B6914",
  wool: "#C8A96E",
  "merino wool": "#C8A96E",
  linen: "#A0925A",
  silk: "#D4B896",
  hemp: "#7A9A3C",
  cashmere: "#C4A882",
  alpaca: "#B8A878",
  bamboo: "#6AAF3D",
  tencel: "#5A9A7A",
  lyocell: "#5A9A7A",
  modal: "#7ABAA0",
  polyester: "#A0A0A0",
  "recycled polyester": "#B8B8B8",
  nylon: "#909090",
  spandex: "#787878",
  elastane: "#787878",
};

function getFiberColor(fiber: string): string {
  return FIBER_COLORS[fiber.toLowerCase()] ?? (fiber ? "#B0B0B0" : "#E0E0E0");
}

export default function MaterialBadge({ composition, naturalPct }: Props) {
  if (composition.length === 0) {
    return (
      <span className="text-xs text-stone-400 italic">Material info unavailable</span>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Stacked fiber bar — visual proportion of each material */}
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {composition.map((entry, i) => (
          <div
            key={i}
            style={{
              width: `${entry.pct}%`,
              backgroundColor: getFiberColor(entry.fiber),
            }}
            title={`${entry.pct}% ${entry.fiber}`}
          />
        ))}
      </div>

      {/* Text list of fibers */}
      <div className="flex flex-wrap gap-1">
        {composition.map((entry, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              entry.isNatural
                ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: getFiberColor(entry.fiber) }}
            />
            {entry.pct}% {entry.fiber}
          </span>
        ))}
      </div>

      {/* Natural fiber total */}
      <p className="text-xs font-semibold text-emerald-700">{naturalPct}% natural fibers</p>
    </div>
  );
}
