// Patagonia — mix of natural, recycled, and synthetic fibers
// Strategy: use their product listing pages, extract material from product spec section.

import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedProduct } from "./types";

const BASE_URL = "https://www.patagonia.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
};

const CATEGORIES: { path: string; label: string }[] = [
  { path: "/shop/womens-shirts-tops", label: "Tops" },
  { path: "/shop/mens-shirts-tops", label: "Tops" },
  { path: "/shop/womens-pants", label: "Bottoms" },
  { path: "/shop/mens-pants", label: "Bottoms" },
  { path: "/shop/womens-fleece", label: "Fleece" },
  { path: "/shop/mens-fleece", label: "Fleece" },
];

async function fetchPage(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 12000 });
    return cheerio.load(res.data);
  } catch {
    return null;
  }
}

async function scrapeProductPage(url: string): Promise<string> {
  const $ = await fetchPage(url);
  if (!$) return "";

  // Patagonia lists fabric in a "Fabric & Care" section or product specs
  const fabricSection = $("[class*='fabric'], [class*='materials'], .product-specs")
    .text()
    .replace(/\s+/g, " ");

  if (fabricSection) {
    const lines = fabricSection.split(/[.\n]/);
    const materialLine = lines.find((line) => line.includes("%"));
    if (materialLine) return materialLine.trim();
  }

  // Fallback: scan all paragraph text for fiber percentages
  const allText = $("p, li, td").text();
  const match = allText.match(/\d+%\s*[A-Za-z][\w\s,/%-]*/);
  return match?.[0]?.trim() ?? "";
}

export async function scrapePatagonia(maxProducts = 50): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();

  for (const { path, label } of CATEGORIES) {
    if (products.length >= maxProducts) break;

    const $ = await fetchPage(`${BASE_URL}${path}`);
    if (!$) continue;

    const cards = $(".product-tile, .grid-item, [class*='product']").toArray();

    for (const card of cards.slice(0, 15)) {
      if (products.length >= maxProducts) break;

      const el = $(card);
      const name = el.find(".product-tile__title, h3, [class*='title']").first().text().trim();
      const href = el.find("a").first().attr("href");
      const imageUrl =
        el.find("img").first().attr("src") || el.find("img").first().attr("data-src") || "";
      const priceText = el.find("[class*='price']").first().text().replace(/[^0-9.]/g, "");

      if (!name || !href) continue;

      const productUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
      if (seen.has(productUrl)) continue;
      seen.add(productUrl);

      const materialRaw = await scrapeProductPage(productUrl);

      products.push({
        name,
        url: productUrl,
        imageUrl: imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl,
        retailer: "Patagonia",
        price: priceText ? parseFloat(priceText) : undefined,
        category: label,
        materialRaw,
      });

      await new Promise((r) => setTimeout(r, 600));
    }
  }

  return products;
}
