import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Generates embeddings using Gemini's gemini-embedding-2-preview model.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2-preview:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.embedding || !data.embedding.values) {
    console.error("Unexpected API response structure:", data);
    return [];
  }
  
  return data.embedding.values;
}

async function main() {
  console.log("🧠 Starting Koda Store v0.2 Embedding Engine (Gemini 2.5 Preview)...\n");

  // Make sure pgvector extension is enabled
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
    console.log("✅ pgvector extension verified");
  } catch (err) {
    console.warn("⚠ Could not verify vector extension:", err);
  }

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
  });

  console.log(`Found ${products.length} products to process.\n`);

  let success = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const text = [
        `Product: ${product.name}`,
        `Category: ${product.category?.name || "Uncategorized"}`,
        `Description: ${product.description}`,
        `Price: $${product.price}`,
        product.featured ? "This is a premium, featured selection." : "",
        product.stock > 0 ? "Currently available in our curated inventory." : "Currently out of stock.",
      ].filter(Boolean).join(". ");

      const embedding = await generateEmbedding(text);
      if (embedding.length === 0) throw new Error("Received empty embedding vector");
      
      const vectorStr = `[${embedding.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO "ProductEmbedding" (id, "productId", embedding, content, "updatedAt")
         VALUES (gen_random_uuid(), $1, $2::vector, $3, NOW())
         ON CONFLICT ("productId") DO UPDATE
         SET embedding = $2::vector, content = $3, "updatedAt" = NOW()`,
        product.id,
        vectorStr,
        text
      );

      success++;
      console.log(`  ✅ [${success}/${products.length}] ${product.name} (${embedding.length} dimensions)`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      failed++;
      console.error(`  ❌ Failed to process ${product.name}:`, err);
    }
  }

  console.log(`\n🎉 Architecture Upgrade Complete: ${success} products embedded, ${failed} failures.`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal engine error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
