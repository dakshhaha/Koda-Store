import { prisma } from "../src/lib/prisma";

async function main() {
  const categories = [
    { name: "Electronics", slug: "electronics", image: "/categories/electronics.png" },
    { name: "Fashion", slug: "fashion", image: "/categories/fashion.png" },
    { name: "Home & Garden", slug: "home-and-garden", image: "/categories/home.png" },
    { name: "Sports & Outdoors", slug: "sports-and-outdoors", image: "/categories/sports.png" },
    { name: "Beauty & Health", slug: "beauty-and-health", image: "/categories/beauty.png" },
    { name: "Accessories", slug: "accessories", image: null },
    { name: "Toys & Games", slug: "toys-and-games", image: null },
    { name: "Automotive", slug: "automotive", image: null },
  ];

  console.log("Seeding categories...");

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { image: cat.image },
      create: cat,
    });
  }

  console.log("Seeding finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
