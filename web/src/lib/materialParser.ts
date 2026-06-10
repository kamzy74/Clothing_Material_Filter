// Natural fibers we recognize. Some (like Tencel/Lyocell) are semi-synthetic
// but widely accepted as eco-friendly — included here but flagged separately.
export const NATURAL_FIBERS = [
  "cotton",
  "organic cotton",
  "wool",
  "merino wool",
  "linen",
  "flax",
  "silk",
  "hemp",
  "cashmere",
  "alpaca",
  "bamboo",
  "jute",
  "ramie",
  "mohair",
  "angora",
  "tencel",
  "lyocell",
  "modal",
];

export const SYNTHETIC_FIBERS = [
  "polyester",
  "recycled polyester",
  "nylon",
  "acrylic",
  "spandex",
  "elastane",
  "lycra",
  "rayon",
  "viscose",
  "acetate",
  "polypropylene",
];

export interface FiberEntry {
  fiber: string;
  pct: number;
  isNatural: boolean;
}

/**
 * Parse a material composition string into structured fiber entries.
 *
 * Examples of input strings this handles:
 *   "100% Organic Cotton"
 *   "60% Cotton, 40% Polyester"
 *   "55% Linen 45% Cotton"
 *   "Shell: 98% Cotton 2% Elastane"
 */
export function parseMaterials(raw: string): FiberEntry[] {
  if (!raw) return [];

  // Normalize: lowercase, remove words like "shell:", "lining:", "fabric:"
  const text = raw
    .toLowerCase()
    .replace(/\b(shell|lining|fabric|body|fill|outer|inner)\s*:/g, "")
    .replace(/\band\b/g, ",");

  // Match patterns like "60% cotton" or "cotton 60%"
  const pctFirst = /(\d+(?:\.\d+)?)\s*%\s*([a-z][a-z\s-]+?)(?=[,;/\n]|$|\d+\s*%)/g;
  const fiberFirst = /([a-z][a-z\s-]+?)\s+(\d+(?:\.\d+)?)\s*%/g;

  const results: FiberEntry[] = [];
  const seen = new Set<string>();

  const addEntry = (pct: number, fiberRaw: string) => {
    const fiber = fiberRaw.trim().replace(/\s+/g, " ");
    if (!fiber || pct <= 0 || pct > 100) return;
    const key = `${fiber}-${pct}`;
    if (seen.has(key)) return;
    seen.add(key);

    const isNatural = NATURAL_FIBERS.some(
      (n) => fiber === n || fiber.includes(n)
    );
    results.push({ fiber, pct, isNatural });
  };

  let match: RegExpExecArray | null;
  while ((match = pctFirst.exec(text)) !== null) {
    addEntry(parseFloat(match[1]), match[2]);
  }
  // Only try fiberFirst if pctFirst found nothing (avoid double-counting)
  if (results.length === 0) {
    while ((match = fiberFirst.exec(text)) !== null) {
      addEntry(parseFloat(match[2]), match[1]);
    }
  }

  return results;
}

/**
 * Given a raw material string, return the total % of natural fibers (0–100).
 */
export function getNaturalFiberPct(raw: string): number {
  const entries = parseMaterials(raw);
  if (entries.length === 0) return 0;
  const naturalTotal = entries
    .filter((e) => e.isNatural)
    .reduce((sum, e) => sum + e.pct, 0);
  return Math.round(naturalTotal);
}

/**
 * Serialize fiber entries to a JSON string for database storage.
 * Like df.to_json() in pandas — just persisting the parsed structure.
 */
export function serializeComposition(entries: FiberEntry[]): string {
  return JSON.stringify(entries);
}

/**
 * Deserialize from database back to fiber entries.
 */
export function deserializeComposition(json: string): FiberEntry[] {
  try {
    return JSON.parse(json) as FiberEntry[];
  } catch {
    return [];
  }
}
