import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("🌱 Seeding database with custom auth and real assets...");

  // 1. CLEAR EXISTING
  await prisma.siteSettings.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. SEED ADMIN + SUPPORT USERS
  const adminPasswordHash = await bcrypt.hash("adminpassword123", 12);
  const supportPasswordHash = await bcrypt.hash("supportpassword123", 12);

  await prisma.user.create({
    data: {
      email: "admin@kodastore.com",
      passwordHash: adminPasswordHash,
      name: "Master Curator",
      role: "admin",
      country: "US",
    }
  });

  await prisma.user.create({
    data: {
      email: "support@kodastore.com",
      passwordHash: supportPasswordHash,
      name: "Support Agent",
      role: "support",
      country: "US",
    }
  });

  // 3. SEED SITE SETTINGS
  await prisma.siteSettings.create({
    data: {
      id: "global",
      storeName: "Koda Store",
      paymentGateway: "stripe",
      aiProvider: "gemini",
      currency: "USD",
      taxRate: 0,
    },
  });

  // 3.5 SEED COUPONS
  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        description: "10% off for first-time buyers",
        discountType: "percent",
        discountValue: 10,
        minOrder: 50,
      },
      {
        code: "SAVE25",
        description: "$25 off on large carts",
        discountType: "fixed",
        discountValue: 25,
        minOrder: 200,
      },
    ],
  });

  // 4. SEED CATEGORIES
  const categories = [
    { name: "Furniture", slug: "furniture" },
    { name: "Lighting", slug: "lighting" },
    { name: "Home & Living", slug: "home-living" },
    { name: "Accessories", slug: "accessories" },
    { name: "Decor", slug: "decor" },
    { name: "Storage", slug: "storage" },
  ];

  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }

  // 5. FETCH SAVED CATEGORIES
  const cats = await prisma.category.findMany();
  const getCatId = (slug: string) => cats.find(c => c.slug === slug)?.id;

  // 6. SEED PRODUCTS WITH REAL ASSETS
  const products = [
    { 
      name: "Sculptural Ceramic Vase", 
      slug: "ceramic-vase", 
      description: "Hand-thrown by a master ceramicist, this sculptural vase adds organic elegance to any surface.", 
      price: 89.00, 
      stock: 12, 
      featured: true, 
      categoryId: getCatId("home-living"),
      images: JSON.stringify(["/images/ceramic_vase_editorial_1775099062134.png"]) 
    },
    { 
      name: "Artisan Leather Tote", 
      slug: "leather-tote", 
      description: "Full-grain vegetable-tanned leather that develops a rich patina over time.", 
      price: 245.00, 
      salePrice: 199.00, 
      stock: 5, 
      featured: true, 
      categoryId: getCatId("accessories"),
      images: JSON.stringify(["/images/leather_tote_editorial_1775099082994.png"])
    },
    { 
      name: "Minimalist Desk Lamp", 
      slug: "desk-lamp", 
      description: "Adjustable brass arm with weighted marble base. Dimmable LED included.", 
      price: 165.00, 
      stock: 18, 
      featured: true, 
      categoryId: getCatId("lighting"),
      images: JSON.stringify(["/images/desk_lamp_editorial_1775099102196.png"])
    },
    { 
      name: "Oak Writing Desk", 
      slug: "writing-desk", 
      description: "Solid white oak with live edge and thin steel legs. Modern masterclass.", 
      price: 890.00, 
      salePrice: 749.00, 
      stock: 3, 
      featured: true, 
      categoryId: getCatId("furniture"),
      images: JSON.stringify(["/images/oak_desk_editorial_1775099128850.png"])
    },
    { 
      name: "Woven Basket Set", 
      slug: "basket-set", 
      description: "Set of three nesting baskets. Handwoven from sustainably sourced materials.", 
      price: 95.00, 
      salePrice: 79.00, 
      stock: 8, 
      categoryId: getCatId("storage"),
      images: JSON.stringify(["/images/woven_basket_editorial_1775099146151.png"])
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log("✅ Database seeded with REAL assets and SECURE auth!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
