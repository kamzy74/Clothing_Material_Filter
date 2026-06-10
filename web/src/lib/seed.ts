// Run this once to populate the database with verified products.
// All URLs have been confirmed to return HTTP 200.
// Pact (wearpact.com) doesn't have individual product pages — products open
// as modals, so their URLs point to the relevant category page.
// Run with: npx tsx src/lib/seed.ts

import prisma from "./db";
import { getNaturalFiberPct, parseMaterials, serializeComposition } from "./materialParser";

const sampleProducts = [
  // ── Patagonia (individual product pages, all verified 200) ────────────────
  {
    name: "Men's Go-To Pocket Tee",
    url: "https://www.patagonia.com/product/mens-go-to-pocket-tee/39586.html",
    imageUrl: "https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/39586_FGX.jpg",
    retailer: "Patagonia",
    price: 45.00,
    category: "Tops",
    materialRaw: "68% Organic Cotton, 32% Recycled Polyester",
  },
  {
    name: "Women's Tee",
    url: "https://www.patagonia.com/product/womens-tee/45175.html",
    imageUrl: "https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/45175_FGX.jpg",
    retailer: "Patagonia",
    price: 39.00,
    category: "Tops",
    materialRaw: "100% Organic Cotton",
  },
  {
    name: "Men's Long-Sleeved Hemp Shirt",
    url: "https://www.patagonia.com/product/mens-long-sleeved-hemp-shirt/53386.html",
    imageUrl: "https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/53386_FGX.jpg",
    retailer: "Patagonia",
    price: 89.00,
    category: "Tops",
    materialRaw: "55% Hemp, 45% Organic Cotton",
  },
  {
    name: "Women's Organic Cotton Quilt Vest",
    url: "https://www.patagonia.com/product/womens-organic-cotton-quilt-vest/28213.html",
    imageUrl: "https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/28213_FGX.jpg",
    retailer: "Patagonia",
    price: 99.00,
    category: "Clothing",
    materialRaw: "100% Organic Cotton",
  },
  {
    name: "Women's Capilene Cool Merino Long-Sleeve Shirt",
    url: "https://www.patagonia.com/product/womens-capilene-cool-merino-long-sleeve-shirt/44580.html",
    imageUrl: "https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/44580_FGX.jpg",
    retailer: "Patagonia",
    price: 89.00,
    category: "Tops",
    materialRaw: "87% Merino Wool, 13% Recycled Nylon",
  },

  // ── Pact / wearpact.com (category page URLs — no individual product URLs exist) ─
  // These link to the correct category page where the product can be found.
  {
    name: "Organic Softspun Essential Crewneck Tee (Women's)",
    url: "https://wearpact.com/women/apparel/tees",
    imageUrl: "https://media.wearpact.com/visualnav/vf1-teeshop-260202.jpg",
    retailer: "Pact",
    price: 24.00,
    category: "Tops",
    materialRaw: "100% Organic Cotton",
  },
  {
    name: "Women's Organic Cotton Chino Pant",
    url: "https://wearpact.com/women/apparel/pants",
    imageUrl: null,
    retailer: "Pact",
    price: 69.99,
    category: "Bottoms",
    materialRaw: "98% Organic Cotton, 2% Elastane",
  },
  {
    name: "Men's Organic Everyday Jogger",
    url: "https://wearpact.com/men/apparel/pants",
    imageUrl: null,
    retailer: "Pact",
    price: 59.99,
    category: "Bottoms",
    materialRaw: "95% Organic Cotton, 5% Spandex",
  },
  {
    name: "Women's Organic Cotton V-Neck Tee",
    url: "https://wearpact.com/women/apparel/tees",
    imageUrl: "https://media.wearpact.com/visualnav/vf2-teeshop-260202.jpg",
    retailer: "Pact",
    price: 22.00,
    category: "Tops",
    materialRaw: "100% Organic Cotton",
  },
  {
    name: "Women's Organic Cotton Fleece Crew",
    url: "https://wearpact.com/women/apparel/hoodies%20&%20sweatshirts",
    imageUrl: null,
    retailer: "Pact",
    price: 79.99,
    category: "Sweaters",
    materialRaw: "80% Organic Cotton, 20% Recycled Polyester",
  },
  {
    name: "Women's Organic Cotton Wrap Dress",
    url: "https://wearpact.com/women/apparel/all%20dresses%20%26%20skirts",
    imageUrl: null,
    retailer: "Pact",
    price: 79.99,
    category: "Dresses",
    materialRaw: "100% Organic Cotton",
  },
  {
    name: "Men's Organic Cotton Henley",
    url: "https://wearpact.com/men/apparel/tops",
    imageUrl: null,
    retailer: "Pact",
    price: 34.99,
    category: "Tops",
    materialRaw: "100% Organic Cotton",
  },
];

async function seed() {
  console.log("Seeding database with verified products...\n");
  let added = 0;
  let skipped = 0;

  for (const product of sampleProducts) {
    const naturalPct = getNaturalFiberPct(product.materialRaw);
    if (naturalPct < 60) {
      console.log(`  SKIP ${product.name} (${naturalPct}% natural — below threshold)`);
      skipped++;
      continue;
    }

    const composition = parseMaterials(product.materialRaw);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { materialRaw, ...productFields } = product;

    await prisma.product.upsert({
      where: { url: product.url },
      update: {
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        naturalFiberPct: naturalPct,
        materialComposition: serializeComposition(composition),
        isActive: true,
        lastScraped: new Date(),
      },
      create: {
        ...productFields,
        naturalFiberPct: naturalPct,
        materialComposition: serializeComposition(composition),
      },
    });
    console.log(`  OK  ${product.name} — ${naturalPct}% natural (${product.url})`);
    added++;
  }

  console.log(`\nDone: ${added} added, ${skipped} skipped`);
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
