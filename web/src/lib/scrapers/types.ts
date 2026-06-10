// Shared type that every scraper returns — like a typed pandas DataFrame row.
export interface ScrapedProduct {
  name: string;
  url: string;
  imageUrl?: string;
  retailer: string;
  price?: number;
  category?: string;
  materialRaw: string; // raw string from the site, e.g. "60% Cotton, 40% Polyester"
}
