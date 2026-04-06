/**
 * Embedding generation and similarity search using Gemini's text-embedding-004 model.
 * Stores embeddings in PostgreSQL via pgvector.
 */
import { prisma } from "@/lib/prisma";

const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMENSION = 768;

/**
 * Generate an embedding vector for a given text using Gemini.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured for embeddings");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Embedding API error:", errorText);
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  const embedding = data.embedding?.values;

  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(`Invalid embedding response: expected ${EMBEDDING_DIMENSION} dimensions`);
  }

  return embedding;
}

/**
 * Search for products similar to the query text using cosine similarity.
 */
export async function similaritySearch(query: string, limit: number = 5) {
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Use raw SQL for pgvector cosine distance search
  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      productId: string;
      content: string;
      distance: number;
    }>
  >(
    `SELECT pe.id, pe."productId", pe.content, 
            pe.embedding <=> $1::vector AS distance
     FROM "ProductEmbedding" pe
     ORDER BY pe.embedding <=> $1::vector ASC
     LIMIT $2`,
    vectorStr,
    limit
  );

  // Fetch full product data for matched products
  const productIds = results.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: { select: { name: true } } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return results.map((r) => ({
    product: productMap.get(r.productId)!,
    distance: r.distance,
    content: r.content,
  })).filter((r) => r.product); // Filter out any missing products
}

/**
 * Upsert a product embedding.
 */
export async function upsertProductEmbedding(
  productId: string,
  text: string
): Promise<void> {
  const embedding = await generateEmbedding(text);
  const vectorStr = `[${embedding.join(",")}]`;

  // Use raw SQL since Prisma doesn't natively support vector types
  await prisma.$executeRawUnsafe(
    `INSERT INTO "ProductEmbedding" (id, "productId", embedding, content, "updatedAt")
     VALUES (gen_random_uuid(), $1, $2::vector, $3, NOW())
     ON CONFLICT ("productId") DO UPDATE
     SET embedding = $2::vector, content = $3, "updatedAt" = NOW()`,
    productId,
    vectorStr,
    text
  );
}
