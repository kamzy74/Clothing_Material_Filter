"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import MaterialBadge from "./MaterialBadge";
import type { FiberEntry } from "@/lib/materialParser";

interface Product {
  id: string;
  name: string;
  url: string;
  imageUrl?: string | null;
  retailer: string;
  price?: number | null;
  category?: string | null;
  naturalFiberPct: number;
  composition: FiberEntry[];
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Product image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-300 text-sm">
            No image
          </div>
        )}
        {/* Natural % badge overlaid on the image */}
        <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur-sm">
          {product.naturalFiberPct}% natural
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
            {product.retailer}
            {product.category && <span className="mx-1">·</span>}
            {product.category}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-stone-800 line-clamp-2">
            {product.name}
          </h3>
          {product.price && (
            <p className="mt-0.5 text-sm text-stone-600">${product.price.toFixed(2)}</p>
          )}
        </div>

        {/* Material breakdown */}
        <MaterialBadge composition={product.composition} naturalPct={product.naturalFiberPct} />

        {/* Link to retailer */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors"
        >
          View on {product.retailer}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
