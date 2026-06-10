// GET /api/products?category=Tops&minNatural=80&fiber=cotton&search=linen+shirt
// This is equivalent to a pandas query with multiple df.loc[] conditions.

import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { deserializeComposition } from "@/lib/materialParser";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const category = params.get("category") ?? undefined;
  const minNatural = parseFloat(params.get("minNatural") ?? "60");
  const maxNatural = parseFloat(params.get("maxNatural") ?? "100");
  const fiber = params.get("fiber")?.toLowerCase() ?? undefined;
  const search = params.get("search")?.toLowerCase() ?? undefined;
  const retailer = params.get("retailer") ?? undefined;
  const page = parseInt(params.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(params.get("limit") ?? "24", 10), 100);
  const offset = (page - 1) * limit;

  // Build a Prisma "where" object — like constructing a SQL WHERE clause
  // or chaining pandas boolean masks.
  const where = {
    isActive: true,
    naturalFiberPct: { gte: minNatural, lte: maxNatural },
    ...(category && { category }),
    ...(retailer && { retailer }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { retailer: { contains: search } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { naturalFiberPct: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Deserialize the JSON composition string back into structured objects,
  // then optionally filter by a specific fiber type.
  let enriched = products.map((p) => ({
    ...p,
    composition: deserializeComposition(p.materialComposition),
  }));

  if (fiber) {
    enriched = enriched.filter((p) =>
      p.composition.some((e) => e.fiber.includes(fiber))
    );
  }

  return Response.json({
    products: enriched,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
