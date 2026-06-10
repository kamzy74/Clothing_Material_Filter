// POST /api/scrape  — triggers a scrape job
// GET  /api/scrape  — returns recent scrape logs

import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { runScraper } from "@/lib/scrapers";

export async function GET() {
  const logs = await prisma.scrapeLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return Response.json({ logs });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const retailer = typeof body.retailer === "string" ? body.retailer : undefined;

  // Run scraper in the background so this request returns immediately
  // (scraping takes minutes — we don't want the HTTP request to time out).
  // Like launching a subprocess with subprocess.Popen() in Python.
  runScraper(retailer).catch(console.error);

  return Response.json({
    message: `Scrape started${retailer ? ` for ${retailer}` : " for all retailers"}`,
  });
}
