import { NextResponse } from "next/server";
import { getAIProvider, type AIProviderName } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/validation";
import { moderateContent } from "@/lib/moderation";

interface PersistedChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  isHuman?: boolean;
}

function safeParseMessages(raw: string | null | undefined): PersistedChatMessage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized: PersistedChatMessage[] = [];
    for (const message of parsed) {
      if (!message || typeof message !== "object") continue;

      const role = (message as { role?: string }).role;
      const content = (message as { content?: string }).content;
      if ((role !== "user" && role !== "assistant" && role !== "system") || typeof content !== "string") {
        continue;
      }

      normalized.push({
        role,
        content,
        timestamp:
          typeof (message as { timestamp?: string }).timestamp === "string"
            ? (message as { timestamp?: string }).timestamp
            : undefined,
        isHuman:
          typeof (message as { isHuman?: boolean }).isHuman === "boolean"
            ? (message as { isHuman?: boolean }).isHuman
            : undefined,
      });
    }

    return normalized;
  } catch {
    return [];
  }
}

function normalizeMessages(input: unknown): PersistedChatMessage[] {
  if (!Array.isArray(input)) return [];

  const normalized: PersistedChatMessage[] = [];
  for (const message of input) {
    if (!message || typeof message !== "object") continue;

    const role = (message as { role?: string }).role;
    const content = (message as { content?: string }).content;
    if ((role !== "user" && role !== "assistant" && role !== "system") || typeof content !== "string") {
      continue;
    }

    normalized.push({ role, content });
  }

  return normalized;
}

function summarizeCatalog(
  products: Array<{
    id: string;
    name: string;
    price: number;
    salePrice: number | null;
    description: string;
    slug: string;
    images: unknown;
    category: { name: string } | null;
  }>
): string {
  if (!products.length) return "No product data available.";

  return products
    .map((product) => {
      const amount = product.salePrice ?? product.price;
      const regularPrice = product.salePrice ? ` (was ${product.price.toFixed(2)})` : "";
      const snippet = product.description.slice(0, 140);
      const imageArr = Array.isArray(product.images) ? product.images : [];
      const firstImage = (imageArr[0] as string) || "";

      return `- ${product.name} [ID:${product.id}] [Category:${product.category?.name || "General"}] Price:${amount.toFixed(2)}${regularPrice} | Slug:${product.slug} | Image:${firstImage} | ${snippet}`;
    })
    .join("\n");
}

function summarizeCoupons(
  coupons: Array<{
    code: string;
    discountType: string;
    discountValue: number;
    minOrder: number;
    maxDiscount: number | null;
    endsAt: Date | null;
  }>
): string {
  if (!coupons.length) return "No active offers right now.";

  return coupons
    .map((coupon) => {
      const value = coupon.discountType === "percent" ? `${coupon.discountValue}% OFF` : `${coupon.discountValue.toFixed(2)} OFF`;
      const expiry = coupon.endsAt ? `, expires ${coupon.endsAt.toISOString().slice(0, 10)}` : "";
      const cap = coupon.maxDiscount ? `, max discount ${coupon.maxDiscount.toFixed(2)}` : "";
      return `- ${coupon.code}: ${value}, min order ${coupon.minOrder.toFixed(2)}${cap}${expiry}`;
    })
    .join("\n");
}

function summarizeUserOrders(
  orders: Array<{
    id: string;
    status: string;
    total: number;
    paymentGateway: string;
    couponCode: string | null;
    createdAt: Date;
  }>
): string {
  if (!orders.length) return "Customer has no orders yet.";

  return orders
    .map(
      (order) =>
        `- ${order.id.slice(0, 8).toUpperCase()} | ${order.status.toUpperCase()} | ${order.total.toFixed(2)} | ${order.paymentGateway.toUpperCase()} | ${order.createdAt.toISOString().slice(0, 10)}${order.couponCode ? ` | coupon ${order.couponCode}` : ""}`
    )
    .join("\n");
}

function shouldEscalateByUserMessage(message: string): boolean {
  if (!message) return false;
  return /(human|agent|representative|supervisor|complaint|chargeback|legal|speak to someone|talk to someone)/i.test(message);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const userSession = await getSession();

    if (!sessionId) {
      if (!userSession) {
        return NextResponse.json({ success: true, sessions: [] });
      }
      const sessions = await (prisma as any).supportSession.findMany({
        where: { userId: userSession.userId },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          chatMessages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        } as any,
      });
      
      const sessionList = (sessions as any[]).map((s: any) => {
        const lastMsg = s.chatMessages[0]?.content || "No messages yet";
        return {
          id: s.id,
          status: s.status,
          updatedAt: s.updatedAt,
          preview: lastMsg.slice(0, 40) + (lastMsg.length > 40 ? "..." : "")
        };
      });

      return NextResponse.json({ success: true, sessions: sessionList });
    }

    const supportSession = await (prisma.supportSession as any).findUnique({
      where: { id: sessionId },
      include: {
        chatMessages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!supportSession) {
      return NextResponse.json({
        success: true,
        status: "ai_handling",
        messages: [],
      });
    }

    const isPrivileged = userSession?.role === "admin" || userSession?.role === "support";
    if (supportSession.userId && !isPrivileged && userSession?.userId !== supportSession.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const messages = ((supportSession as any).chatMessages || []).map((m: any) => ({
      role: m.role,
      content: m.content,
      isHuman: m.isHuman,
      timestamp: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      status: supportSession.status,
      messages,
      updatedAt: supportSession.updatedAt,
    });
  } catch (error) {
    console.error("Chat session fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch chat session." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit: 8/min for authenticated, 3/min for anonymous (decreased for safety)
    const clientIp = getClientIp(request);
    const userSession = await getSession();
    const rateLimitKey = `chat:${userSession?.userId || clientIp}`;
    const limit = userSession ? 8 : 3;
    const rl = await rateLimit(rateLimitKey, limit, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }
    const { messages, provider, sessionId } = await request.json();
    const normalizedMessages = normalizeMessages(messages);

    // 1. Moderate & Sanitize
    const latestUserEntry = [...normalizedMessages].reverse().find(m => m.role === "user");
    if (latestUserEntry) {
      const mod = moderateContent(latestUserEntry.content);
      if (mod.flagged) {
        return NextResponse.json({ error: mod.reason || "Content flagged by safety policy." }, { status: 400 });
      }
      latestUserEntry.content = sanitizeString(latestUserEntry.content, 4000);
    }

    if (normalizedMessages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const existingSupportSession = sessionId
      ? await (prisma.supportSession as any).findUnique({ 
          where: { id: sessionId },
          include: { chatMessages: { orderBy: { createdAt: "asc" } } }
        })
      : null;

    if (existingSupportSession?.userId && userSession?.userId !== existingSupportSession.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const latestUserMessage =
      [...normalizedMessages]
        .reverse()
        .find((message) => message.role === "user")
        ?.content.trim() || "";

    if (existingSupportSession?.status === "resolved") {
      return NextResponse.json({ error: "This chat has been resolved. Please start a new one." }, { status: 400 });
    }

    if ((existingSupportSession?.status === "human_needed" || existingSupportSession?.status === "agent_active") && sessionId) {
      const waitingNotice = "A human support agent has taken over this chat. Please hold on while they reply.";
      const existingMessages = ((existingSupportSession as any).chatMessages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
        isHuman: m.isHuman
      }));
      const waitingMessages = [...existingMessages];

      const latestUserEntry = [...normalizedMessages]
        .reverse()
        .find((message) => message.role === "user");

      if (latestUserEntry) {
        const latestStored = existingSupportSession.chatMessages[existingSupportSession.chatMessages.length - 1];
        const isDuplicateUserMessage =
          latestStored?.role === "user" && latestStored.content.trim() === latestUserEntry.content.trim();

        if (!isDuplicateUserMessage) {
          await (prisma as any).chatMessage.create({
            data: {
              sessionId: sessionId,
              role: "user",
              content: latestUserEntry.content,
              isHuman: false
            }
          });
        }
      }

      await prisma.supportSession.update({
        where: { id: sessionId },
        data: {
          updatedAt: new Date(),
          status: existingSupportSession?.status || "human_needed",
        },
      });

      return NextResponse.json({
        success: true,
        provider: "human-handoff-silent",
        response: "", // Stay silent
        status: existingSupportSession?.status || "human_needed",
      });
    }

    let products: any[] = [];
    let categories: any[] = [];
    let activeCoupons: any[] = [];
    let recommendedOffers: any[] = [];
    let recentOrders: any[] = [];
    let settings: any = null;

    try {
      const results = await Promise.allSettled([
        prisma.product.findMany({
          take: 50,
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            name: true,
            price: true,
            salePrice: true,
            description: true,
            slug: true,
            stock: true,
            images: true,
            category: { select: { name: true } },
          },
        }),
        prisma.category.findMany({ select: { name: true, slug: true } }),
        prisma.coupon.findMany({
          where: {
            active: true,
            OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
            AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }],
          },
          take: 10,
          orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
          select: {
            code: true,
            discountType: true,
            discountValue: true,
            minOrder: true,
            maxDiscount: true,
            endsAt: true,
          },
        }),
        prisma.product.findMany({
          where: {
            OR: [{ salePrice: { not: null } }, { featured: true }],
          },
          take: 10,
          orderBy: [{ salePrice: "asc" }, { featured: "desc" }, { createdAt: "desc" }],
          select: {
            name: true,
            slug: true,
            price: true,
            salePrice: true,
            category: { select: { name: true } },
          },
        }),
        userSession
          ? prisma.order.findMany({
              where: { userId: userSession.userId },
              orderBy: { createdAt: "desc" },
              take: 6,
              select: {
                id: true,
                status: true,
                total: true,
                paymentGateway: true,
                couponCode: true,
                createdAt: true,
              },
            })
          : Promise.resolve([]),
        prisma.siteSettings.findUnique({ where: { id: "global" } }),
      ]);

      if (results[0].status === "fulfilled") products = results[0].value;
      if (results[1].status === "fulfilled") categories = results[1].value;
      if (results[2].status === "fulfilled") activeCoupons = results[2].value;
      if (results[3].status === "fulfilled") recommendedOffers = results[3].value;
      if (results[4].status === "fulfilled") recentOrders = results[4].value;
      if (results[5].status === "fulfilled") settings = results[5].value;
    } catch (e) {
      console.warn("Catalog context fetch partially failed, continuing with empty context:", e);
    }

    const catalogContext = summarizeCatalog(products);
    const categoryContext = categories.map(c => `- ${c.name} (/categories/${c.slug})`).join("\n");
    const couponContext = summarizeCoupons(activeCoupons);
    const userOrderContext = summarizeUserOrders(recentOrders);
    const offerContext = recommendedOffers
      .map((product) => {
        const amount = product.salePrice ?? product.price;
        return `- ${product.name} (${product.category?.name || "General"}) at ${amount.toFixed(2)}${product.salePrice ? `, was ${product.price.toFixed(2)}` : ""} -> /products/${product.slug}`;
      })
      .join("\n");

    const systemPrompt = `You are Koda, the Koda Store Expert Assistant. Use the following database context to provide accurate, helpful support.

STORE INFO:
- Name: ${settings?.storeName || "Koda Store"}
- Current Currency: ${settings?.currency || "USD"}

CATEGORIES:
${categoryContext}

DETAILED CATALOG (TOP PRODUCTS):
${catalogContext}

ACTIVE COUPONS & DEALS:
${couponContext}

CURRENT DEALS/SALE ITEMS:
${offerContext || "No specific sales currently."}

CUSTOMER ACCOUNT CONTEXT:
- Name: ${userSession?.name || "Guest"}
- Email: ${userSession?.email || "N/A"}
${userOrderContext}

AI RULES:
1. HELP USERS FIND DEALS: If they ask for offers, show them the COUPONS and SALE ITEMS.
2. PRODUCT RENDERING (CRITICAL): Whenever you mention or recommend a product, you MUST embed it using this exact syntax: [[PRODUCT:id:name:price:image_url:slug]].
   Example: "You might like the [[PRODUCT:uuid-123:Woven Basket:79.00:https://img.com/a.jpg:basket-set]]."
3. PRODUCT LINKS: Always refer to products using /products/slug in your text responses.
4. PERSONALIZED SUPPORT: Use the customer's order history to answer status questions.
5. FILE SENDING: If a user asks for an invoice or file, tell them they can find it in their order history at /orders/{orderId}/receipt.
6. HUMAN HANDOFF: If the user is frustrated, angry, or the issue is complex (like payment failure or refund logic), DO NOT transfer immediately. 
   STEP 0 (FOR GUESTS): If context Name is "Guest", tell them: "I'd the happy to connect you to an agent, but you'll need to log in to your account first so we can securely access your details. Please log in and ask me again!" (Stop handoff flow).
   STEP 1: Ask "Would you like me to connect you to a human agent who can help with this?".
   STEP 2: If they say yes, ask "To help our agent assist you faster, could you briefly describe the specific error or issue you're facing?" (DO NOT include the handoff phrase yet).
   STEP 3: ONLY once they have described the issue, say: "I've logged those details. I'll connect you to our support team right now. please wait agent will take over chat shortly."
   The system ONLY handsoff when you say the EXACT PHRASE: "I'll connect you to our support team right now." (Crucial: Never say this and ask a question in the same message).`;

    const enhancedMessages = [
      { role: "system" as const, content: systemPrompt },
      ...normalizedMessages.filter((message) => message.role !== "system").map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    let selectedProvider: AIProviderName | undefined = provider;
    if (!selectedProvider) {
      selectedProvider = (settings?.aiProvider as AIProviderName) || "gemini";
    }

    const aiProvider = getAIProvider(selectedProvider);
    
    // STREAMING FLOW
    const stream = await aiProvider.chatStream(enhancedMessages, userSession?.userId);
    let fullResponse = "";

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        fullResponse += text;
        controller.enqueue(chunk);
      },
      async flush() {
        // BACKGROUND PERSISTENCE: Save the complete message after the stream finishes
        const handoffConfirmationPhrase = "I'll connect you to our support team right now.";
        const needsHandoffFromAI = fullResponse.includes(handoffConfirmationPhrase);
        const userWantsHandoff = latestUserMessage.toLowerCase().match(/^(connect me to a human|talk to human|agent please|speak with agent)$/i);
        let finalStatus = (needsHandoffFromAI || userWantsHandoff) ? "human_needed" : "ai_handling";

        if (finalStatus === "human_needed" && !userSession) {
          finalStatus = "ai_handling";
        }

        try {
          const session = await prisma.supportSession.upsert({
            where: { id: sessionId },
            update: {
              status: finalStatus,
              userId: existingSupportSession?.userId || userSession?.userId || null,
              updatedAt: new Date(),
            },
            create: {
              id: sessionId,
              userId: userSession?.userId || null,
              status: finalStatus,
            },
          });

          const latestMsg = normalizedMessages[normalizedMessages.length - 1];
          if (latestMsg && latestMsg.role === "user") {
            await (prisma as any).chatMessage.create({
              data: { sessionId: session.id, role: "user", content: latestMsg.content, isHuman: false },
            });
          }
          await (prisma as any).chatMessage.create({
            data: { sessionId: session.id, role: "assistant", content: fullResponse, isHuman: false },
          });
        } catch (e) {
          console.error("Stream persistence error:", e);
        }
      }
    });

    return new Response(stream.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json({
      error: "I'm sorry, I'm having trouble processing your request right now."
    }, { status: 500 });
  }
}
