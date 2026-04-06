import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ 
connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false } 
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
console.log("🌱 Seeding database with custom auth and real assets...");

// 1. CLEAR EXISTING (Ordered to handle dependencies)
const deleteOrders = [
  'chatMessage',
  'supportSession',
  'cartItem',
  'cart',
  'orderItem',
  'order',
  'review',
  'referral',
  'address',
  'productEmbedding',
  'product',
  'category',
  'account',
  'session',
  'user',
  'siteSettings',
  'coupon',
  'announcement',
];

for (const model of deleteOrders) {
  try {
    // @ts-ignore - dynamic model access to avoid ghost lint errors
    if (prisma[model]) await prisma[model].deleteMany({});
  } catch (err) {
    console.warn(`  ⚠ Could not clear ${model}:`, (err as Error).message);
  }
}

// 2. SEED ADMIN + SUPPORT USERS (Use upsert to avoid P2002)
const adminPasswordHash = await bcrypt.hash("adminpassword123", 12);
const supportPasswordHash = await bcrypt.hash("supportpassword123", 12);

await prisma.user.upsert({
  where: { email: "admin@kodastore.com" },
  update: { passwordHash: adminPasswordHash, role: "admin" },
  create: {
    email: "admin@kodastore.com",
    passwordHash: adminPasswordHash,
    name: "Master Curator",
    role: "admin",
    country: "US",
  }
});

await prisma.user.upsert({
  where: { email: "support@kodastore.com" },
  update: { passwordHash: supportPasswordHash, role: "support" },
  create: {
    email: "support@kodastore.com",
    passwordHash: supportPasswordHash,
    name: "Support Agent",
    role: "support",
    country: "US",
  }
});

// 3. SEED SITE SETTINGS
await prisma.siteSettings.upsert({
  where: { id: "global" },
  update: { storeName: "Koda Store", aiProvider: "gemini" },
  create: {
    id: "global",
    storeName: "Koda Store",
    paymentGateway: "stripe",
    aiProvider: "gemini",
    currency: "USD",
    taxRate: 0,
  },
});

// 3.5 SEED COUPONS
const coupons = [
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
];

for (const coupon of coupons) {
  await prisma.coupon.upsert({
    where: { code: coupon.code },
    update: coupon,
    create: coupon,
  });
}

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
  await prisma.category.upsert({
    where: { slug: cat.slug },
    update: cat,
    create: cat,
  });
}

// 5. FETCH SAVED CATEGORIES
const cats = await prisma.category.findMany();
const getCatId = (slug: string) => cats.find(c => c.slug === slug)?.id || null;

// 6. SEED PRODUCTS
const products = [
  { 
    name: "Sculptural Ceramic Vase", 
    slug: "ceramic-vase", 
    description: "Hand-thrown by a master ceramicist, this sculptural vase adds organic elegance to any surface.", 
    price: 89.00, 
    stock: 12, 
    featured: true, 
    categoryId: getCatId("home-living"),
    images: ["/images/ceramic_vase_editorial_1775099062134.png"],
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
    images: ["/images/leather_tote_editorial_1775099082994.png"],
  },
  { 
    name: "Minimalist Desk Lamp", 
    slug: "desk-lamp", 
    description: "Adjustable brass arm with weighted marble base. Dimmable LED included.", 
    price: 165.00, 
    stock: 18, 
    featured: true, 
    categoryId: getCatId("lighting"),
    images: ["/images/desk_lamp_editorial_1775099102196.png"],
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
    images: ["/images/oak_desk_editorial_1775099128850.png"],
  },
  { 
    name: "Woven Basket Set", 
    slug: "basket-set", 
    description: "Set of three nesting baskets. Handwoven from sustainably sourced materials.", 
    price: 95.00, 
    salePrice: 79.00, 
    stock: 8, 
    categoryId: getCatId("storage"),
    images: ["/images/woven_basket_editorial_1775099146151.png"],
  },
];

for (const product of products) {
  await prisma.product.upsert({ 
    where: { slug: product.slug },
    update: { ...product, images: product.images as any },
    create: { ...product, images: product.images as any } 
  });
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
