// This is the orchestrator — like a Python script that calls each scraper,
// filters results, and loads them into a database (ETL pipeline).

import prisma from "@/lib/db";
import {
  getNaturalFiberPct,
  parseMaterials,
  serializeComposition,
} from "@/lib/materialParser";
import { scrapePact } from "./pact";
import { scrapePatagonia } from "./patagonia";
import { scrapeEverlane } from "./everlane";

const MIN_NATURAL_PCT = 60;

export async function runScraper(retailer?: string) {
  const results: { retailer: string; saved: number; skipped: number; error?: string }[] = [];

  const scrapers: { name: string; fn: () => Promise<Awaited<ReturnType<typeof scrapePact>>> }[] = [
    { name: "Pact", fn: () => scrapePact(30) },
    { name: "Patagonia", fn: () => scrapePatagonia(30) },
    { name: "Everlane", fn: () => scrapeEverlane(30) },
  ].filter((s) => !retailer || s.name.toLowerCase() === retailer.toLowerCase());

  for (const { name, fn } of scrapers) {
    let saved = 0;
    let skipped = 0;

    try {
      const products = await fn();

      for (const product of products) {
        const naturalPct = getNaturalFiberPct(product.materialRaw);

        // Only store products that meet the 60% natural fiber threshold.
        // Like a pandas df.loc[df['natural_pct'] >= 60] filter.
        if (naturalPct < MIN_NATURAL_PCT && product.materialRaw !== "") {
          skipped++;
          continue;
        }

        const composition = parseMaterials(product.materialRaw);

        // upsert: update if URL already exists, insert otherwise.
        // Like df.merge() with how='outer' — avoids duplicates.
        await prisma.product.upsert({
          where: { url: product.url },
          update: {
            name: product.name,
            imageUrl: product.imageUrl,
            price: product.price,
            naturalFiberPct: naturalPct,
            materialComposition: serializeComposition(composition),
            lastScraped: new Date(),
            isActive: true,
          },
          create: {
            name: product.name,
            url: product.url,
            imageUrl: product.imageUrl,
            retailer: product.retailer,
            price: product.price,
            category: product.category,
            naturalFiberPct: naturalPct,
            materialComposition: serializeComposition(composition),
          },
        });
        saved++;
      }

      await prisma.scrapeLog.create({
        data: { retailer: name, status: "success", count: saved },
      });

      results.push({ retailer: name, saved, skipped });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.scrapeLog.create({
        data: { retailer: name, status: "error", message },
      });
      results.push({ retailer: name, saved, skipped, error: message });
    }
  }

  return results;
}
