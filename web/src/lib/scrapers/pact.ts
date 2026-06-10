// Pact (pactapparel.com) — organic cotton focus, clear material labels
// Strategy: hit their sitemap/collection pages, then fetch each product page
// to extract material info from the product description.

import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedProduct } from "./types";

const BASE_URL = "https://www.pactapparel.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
};

// Collection slugs to scrape — these are Pact's main clothing categories
const COLLECTIONS = [
  "/collections/womens-organic-cotton-tees",
  "/collections/mens-organic-cotton-tees",
  "/collections/womens-organic-cotton-pants",
  "/collections/mens-organic-cotton-pants",
  "/collections/womens-dresses",
  "/collections/womens-sweaters",
];

async function fetchPage(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    return cheerio.load(res.data);
  } catch {
    return null;
  }
}

async function scrapeProductPage(url: string): Promise<string> {
  const $ = await fetchPage(url);
  if (!$) return "";

  // Pact lists materials in product description — look for text with % signs
  const descText = $(".product-description, .product__description, [class*='description']")
    .text()
    .replace(/\s+/g, " ");

  // Find lines containing material percentages
  const lines = descText.split(/[.\n]/);
  const materialLine = lines.find(
    (line) => line.includes("%") && /cotton|wool|linen|silk|polyester|nylon/i.test(line)
  );

  return materialLine?.trim() ?? "";
}

export async function scrapePact(maxProducts = 50): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();

  for (const collection of COLLECTIONS) {
    if (products.length >= maxProducts) break;

    const $ = await fetchPage(`${BASE_URL}${collection}`);
    if (!$) continue;

    // Product cards on collection pages
    const cards = $(".product-item, .grid-product, [class*='product-card']").toArray();

    for (const card of cards) {
      if (products.length >= maxProducts) break;

      const el = $(card);
      const name = el.find("[class*='title'], .product-title, h3, h2").first().text().trim();
      const href = el.find("a").first().attr("href");
      const imageUrl =
        el.find("img").first().attr("src") ||
        el.find("img").first().attr("data-src") ||
        "";
      const priceText = el.find("[class*='price']").first().text().replace(/[^0-9.]/g, "");

      if (!name || !href) continue;

      const productUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
      if (seen.has(productUrl)) continue;
      seen.add(productUrl);

      // Determine category from the collection slug
      const category = collection.includes("tee")
        ? "Tops"
        : collection.includes("pant")
        ? "Bottoms"
        : collection.includes("dress")
        ? "Dresses"
        : collection.includes("sweater")
        ? "Sweaters"
        : "Clothing";

      const materialRaw = await scrapeProductPage(productUrl);

      products.push({
        name,
        url: productUrl,
        imageUrl: imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl,
        retailer: "Pact",
        price: priceText ? parseFloat(priceText) : undefined,
        category,
        materialRaw,
      });

      // Be polite — small delay between requests (like time.sleep in Python)
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return products;
}
