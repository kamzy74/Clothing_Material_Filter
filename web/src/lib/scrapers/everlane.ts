// Everlane — transparent pricing, often lists exact material breakdown
// Strategy: they have JSON-LD structured data on product pages which is
// much easier to parse than HTML (like a clean CSV vs a messy spreadsheet).

import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedProduct } from "./types";

const BASE_URL = "https://www.everlane.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
};

const COLLECTIONS = [
  { path: "/collections/womens-tees", label: "Tops" },
  { path: "/collections/mens-tees", label: "Tops" },
  { path: "/collections/womens-pants", label: "Bottoms" },
  { path: "/collections/mens-pants", label: "Bottoms" },
  { path: "/collections/womens-sweaters", label: "Sweaters" },
  { path: "/collections/mens-sweaters", label: "Sweaters" },
  { path: "/collections/womens-dresses", label: "Dresses" },
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

  // Try JSON-LD first — structured data embedded in the page as a <script> tag.
  // This is like reading from a clean JSON file instead of parsing messy HTML.
  const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse($(script).html() ?? "");
      if (data.material) return data.material;
      if (data.description && data.description.includes("%")) {
        const match = data.description.match(/\d+%\s*[A-Za-z][\w\s,/%-]*/);
        if (match) return match[0];
      }
    } catch {
      // ignore malformed JSON
    }
  }

  // Fallback: look for material text in the details/specs section
  const detailsText = $("[class*='details'], [class*='material'], [class*='fabric']")
    .text()
    .replace(/\s+/g, " ");

  if (detailsText.includes("%")) {
    const match = detailsText.match(/\d+%\s*[A-Za-z][\w\s,/%-]*/);
    if (match) return match[0];
  }

  return "";
}

export async function scrapeEverlane(maxProducts = 50): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();

  for (const { path, label } of COLLECTIONS) {
    if (products.length >= maxProducts) break;

    const $ = await fetchPage(`${BASE_URL}${path}`);
    if (!$) continue;

    // Everlane uses React-rendered content — try to find product links
    const links = $("a[href*='/products/']").toArray();

    for (const link of links.slice(0, 12)) {
      if (products.length >= maxProducts) break;

      const el = $(link);
      const href = el.attr("href") ?? "";
      if (!href) continue;

      const productUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
      if (seen.has(productUrl)) continue;
      seen.add(productUrl);

      const name =
        el.find("[class*='name'], [class*='title']").first().text().trim() ||
        el.attr("aria-label") ||
        href.split("/products/")[1]?.replace(/-/g, " ") ||
        "";
      const imageUrl =
        el.find("img").first().attr("src") || el.find("img").first().attr("data-src") || "";
      const priceText = el.find("[class*='price']").first().text().replace(/[^0-9.]/g, "");

      const materialRaw = await scrapeProductPage(productUrl);

      products.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        url: productUrl,
        imageUrl: imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl,
        retailer: "Everlane",
        price: priceText ? parseFloat(priceText) : undefined,
        category: label,
        materialRaw,
      });

      await new Promise((r) => setTimeout(r, 600));
    }
  }

  return products;
}
