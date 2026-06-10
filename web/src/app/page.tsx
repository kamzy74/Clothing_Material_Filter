"use client";

// The main page. In Next.js App Router, any file called page.tsx
// in src/app/ automatically becomes a URL route.
// "use client" at the top means this component runs in the browser
// (needed because it has interactive state like filter inputs).
//
// Python analogy: this is like a Streamlit app — state in variables,
// UI components react when state changes, data fetches on each change.

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import FilterPanel, { type Filters } from "@/components/FilterPanel";
import ProductCard from "@/components/ProductCard";
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

interface ApiResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  category: "",
  minNatural: 60,
  fiber: "",
  retailer: "",
};

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState("");

  // fetchProducts is like running a filtered pandas query and
  // updating the displayed results — fires whenever filters change.
  const fetchProducts = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({
      minNatural: String(f.minNatural),
      page: String(p),
      limit: "24",
    });
    if (f.search) params.set("search", f.search);
    if (f.category) params.set("category", f.category);
    if (f.fiber) params.set("fiber", f.fiber);
    if (f.retailer) params.set("retailer", f.retailer);

    try {
      const res = await fetch(`/api/products?${params}`);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever filters or page change
  useEffect(() => {
    fetchProducts(filters, page);
  }, [filters, page, fetchProducts]);

  const handleFilterChange = (f: Filters) => {
    setFilters(f);
    setPage(1);
  };

  const triggerScrape = async () => {
    setScraping(true);
    setScrapeMsg("");
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    setScrapeMsg(json.message);
    setScraping(false);
    setTimeout(() => fetchProducts(filters, page), 5000);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Natural Fiber Finder
            </h1>
            <p className="mt-0.5 text-sm text-stone-500">
              Clothing from ethical retailers — all ≥60% natural fibers
            </p>
          </div>
          <button
            onClick={triggerScrape}
            disabled={scraping}
            className="flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {scraping && <Loader2 className="h-4 w-4 animate-spin" />}
            {scraping ? "Scraping…" : "Refresh Products"}
          </button>
        </div>
        {scrapeMsg && (
          <p className="mx-auto mt-2 max-w-7xl text-xs text-stone-400">{scrapeMsg}</p>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <div className="w-56 shrink-0">
            <FilterPanel filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Product grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-stone-500">
                {loading
                  ? "Loading…"
                  : data
                  ? `${data.total} products found`
                  : "No data yet"}
              </p>
              {data && data.pages > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded px-2 py-1 hover:bg-stone-200 disabled:opacity-30"
                  >
                    ← Prev
                  </button>
                  <span className="text-stone-500">
                    {page} / {data.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="rounded px-2 py-1 hover:bg-stone-200 disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
              </div>
            ) : data && data.products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {data.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-stone-400">
                <p className="text-lg font-medium">No products yet</p>
                <p className="max-w-xs text-center text-sm">
                  Click &ldquo;Refresh Products&rdquo; to scrape the latest clothing from Pact,
                  Patagonia, and Everlane.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
