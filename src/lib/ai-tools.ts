/**
 * AI Tool definitions for the tool-calling agent architecture.
 * Each tool wraps a Prisma query and returns structured data.
 */
import { prisma } from "@/lib/prisma";
import { similaritySearch } from "@/lib/embeddings";

// =============================================================================
// TOOL DEFINITIONS (Gemini function calling format)
// =============================================================================

export const AI_TOOLS = [
  {
    name: "search_products",
    description: "Search products by name, description, or category using semantic similarity. Use this when the user asks about products, recommendations, or browsing.",
    parameters: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "The search query describing what the user is looking for" },
        limit: { type: "number", description: "Maximum number of results to return (default 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_product_details",
    description: "Get detailed information about a specific product by its slug or ID.",
    parameters: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "The product slug" },
        productId: { type: "string", description: "The product ID (UUID)" },
      },
      required: [],
    },
  },
  {
    name: "get_order_status",
    description: "Get the status and details of a user's order by order ID.",
    parameters: {
      type: "object" as const,
      properties: {
        orderId: { type: "string", description: "The order ID (first 8 chars uppercase)" },
      },
      required: ["orderId"],
    },
  },
  {
    name: "list_user_orders",
    description: "List the authenticated user's recent orders.",
    parameters: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Number of orders to fetch (default 5)" },
      },
      required: [],
    },
  },
  {
    name: "get_active_coupons",
    description: "Get all currently active coupon codes and deals.",
    parameters: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "check_stock",
    description: "Check the current stock level of a product.",
    parameters: {
      type: "object" as const,
      properties: {
        productId: { type: "string", description: "The product ID" },
        slug: { type: "string", description: "The product slug" },
      },
      required: [],
    },
  },
  {
    name: "list_categories",
    description: "List all product categories in the store.",
    parameters: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// Gemini-format tools wrapper
export const GEMINI_TOOLS = [
  {
    functionDeclarations: AI_TOOLS,
  },
];

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<string> {
  try {
    switch (toolName) {
      case "search_products":
        return await searchProducts(args.query as string, (args.limit as number) || 5);

      case "get_product_details":
        return await getProductDetails(args.slug as string | undefined, args.productId as string | undefined);

      case "get_order_status":
        return await getOrderStatus(args.orderId as string, userId);

      case "list_user_orders":
        return await listUserOrders(userId, (args.limit as number) || 5);

      case "get_active_coupons":
        return await getActiveCoupons();

      case "check_stock":
        return await checkStock(args.slug as string | undefined, args.productId as string | undefined);

      case "list_categories":
        return await listCategories();

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err) {
    console.error(`Tool execution error (${toolName}):`, err);
    return JSON.stringify({ error: `Failed to execute ${toolName}` });
  }
}

// --- Individual tool implementations ---

async function searchProducts(query: string, limit: number): Promise<string> {
  try {
    // Try semantic search first (pgvector)
    const results = await similaritySearch(query, limit);
    if (results.length > 0) {
      const formatted = results.map((r) => {
        const p = r.product;
        const images = Array.isArray(p.images) ? p.images : [];
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.salePrice ?? p.price,
          originalPrice: p.price,
          category: p.category?.name || "General",
          image: (images[0] as string) || "",
          inStock: p.stock > 0,
          description: p.description.slice(0, 150),
        };
      });
      return JSON.stringify({ products: formatted, source: "semantic" });
    }
  } catch {
    // Fall back to text search if embeddings aren't available
  }

  // Fallback: simple text search
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { category: { select: { name: true } } },
    take: limit,
  });

  const formatted = products.map((p) => {
    const images = Array.isArray(p.images) ? p.images : [];
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.salePrice ?? p.price,
      originalPrice: p.price,
      category: p.category?.name || "General",
      image: (images[0] as string) || "",
      inStock: p.stock > 0,
      description: p.description.slice(0, 150),
    };
  });

  return JSON.stringify({ products: formatted, source: "text" });
}

async function getProductDetails(slug?: string, productId?: string): Promise<string> {
  const where = slug ? { slug } : productId ? { id: productId } : null;
  if (!where) return JSON.stringify({ error: "Either slug or productId is required" });

  const product = await prisma.product.findFirst({
    where,
    include: { category: { select: { name: true } }, reviews: { select: { rating: true } } },
  });

  if (!product) return JSON.stringify({ error: "Product not found" });

  const images = Array.isArray(product.images) ? product.images : [];
  const avgRating = product.reviews.length > 0
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : "No reviews";

  return JSON.stringify({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.salePrice ?? product.price,
    originalPrice: product.price,
    description: product.description,
    category: product.category?.name || "General",
    image: (images[0] as string) || "",
    stock: product.stock,
    rating: avgRating,
    reviewCount: product.reviews.length,
  });
}

async function getOrderStatus(orderId: string, userId?: string): Promise<string> {
  if (!userId) return JSON.stringify({ error: "User must be logged in to check order status" });

  // Match by first 8 chars (case-insensitive)
  const normalizedId = orderId.trim().toLowerCase();
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const matched = orders.find((o) => o.id.toLowerCase().startsWith(normalizedId) || o.id.slice(0, 8).toLowerCase() === normalizedId);
  if (!matched) return JSON.stringify({ error: `No order found matching "${orderId}"` });

  return JSON.stringify({
    orderId: matched.id.slice(0, 8).toUpperCase(),
    status: matched.status,
    total: matched.total,
    currency: matched.currency,
    paymentGateway: matched.paymentGateway,
    createdAt: matched.createdAt.toISOString().slice(0, 10),
    items: matched.items.map((i) => ({ name: i.product.name, qty: i.quantity, price: i.price })),
  });
}

async function listUserOrders(userId?: string, limit: number = 5): Promise<string> {
  if (!userId) return JSON.stringify({ error: "User must be logged in to view orders" });

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, status: true, total: true, currency: true,
      paymentGateway: true, couponCode: true, createdAt: true,
    },
  });

  if (orders.length === 0) return JSON.stringify({ message: "No orders yet" });

  return JSON.stringify({
    orders: orders.map((o) => ({
      id: o.id.slice(0, 8).toUpperCase(),
      status: o.status,
      total: o.total,
      gateway: o.paymentGateway,
      date: o.createdAt.toISOString().slice(0, 10),
      coupon: o.couponCode || null,
    })),
  });
}

async function getActiveCoupons(): Promise<string> {
  const coupons = await prisma.coupon.findMany({
    where: {
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }],
    },
    take: 10,
    select: {
      code: true, discountType: true, discountValue: true,
      minOrder: true, maxDiscount: true, endsAt: true, description: true,
    },
  });

  if (coupons.length === 0) return JSON.stringify({ message: "No active coupons right now" });

  return JSON.stringify({
    coupons: coupons.map((c) => ({
      code: c.code,
      description: c.description,
      discount: c.discountType === "percent" ? `${c.discountValue}% OFF` : `$${c.discountValue.toFixed(2)} OFF`,
      minOrder: c.minOrder,
      maxDiscount: c.maxDiscount,
      expires: c.endsAt?.toISOString().slice(0, 10) || "No expiry",
    })),
  });
}

async function checkStock(slug?: string, productId?: string): Promise<string> {
  const where = slug ? { slug } : productId ? { id: productId } : null;
  if (!where) return JSON.stringify({ error: "Either slug or productId is required" });

  const product = await prisma.product.findFirst({
    where,
    select: { name: true, stock: true, slug: true },
  });

  if (!product) return JSON.stringify({ error: "Product not found" });

  return JSON.stringify({
    name: product.name,
    slug: product.slug,
    stock: product.stock,
    available: product.stock > 0,
    lowStock: product.stock > 0 && product.stock <= 5,
  });
}

async function listCategories(): Promise<string> {
  const categories = await prisma.category.findMany({
    select: { name: true, slug: true, _count: { select: { products: true } } },
  });

  return JSON.stringify({
    categories: categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
      url: `/categories/${c.slug}`,
    })),
  });
}
