import { NextResponse } from "next/server";
import { SUPPORTED_GATEWAYS } from "@/lib/payment";
import { SUPPORTED_AI_PROVIDERS } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const supportedGatewayValues = SUPPORTED_GATEWAYS as readonly string[];

function normalizeHiddenGateways(input: unknown): string[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.filter((gateway): gateway is string => typeof gateway === "string" && supportedGatewayValues.includes(gateway));
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.filter((gateway): gateway is string => typeof gateway === "string" && supportedGatewayValues.includes(gateway));
      }
    } catch {
      return [];
    }
  }

  return [];
}

// GET - Fetch current settings from database
export async function GET() {
  try {
    const session = await getSession();

    const settings = await prisma.siteSettings.findUnique({
      where: { id: "global" }
    });

    const fallback = {
      storeName: "Koda Store",
      paymentGateway: "stripe",
      hiddenGateways: [],
      aiProvider: "gemini",
      currency: "USD",
      taxRate: 0,
      supportedGateways: SUPPORTED_GATEWAYS,
      supportedAIProviders: SUPPORTED_AI_PROVIDERS,
      databaseProvider: "sqlite",
      maintenanceMode: false,
      maintenanceMessage: "We're currently performing maintenance. Please check back shortly.",
    };

    if (!settings) {
      return NextResponse.json(fallback);
    }

    const normalizedHiddenGateways = normalizeHiddenGateways((settings as { hiddenGateways?: string | null }).hiddenGateways);
    const rawSettings = settings as Record<string, unknown>;

    if (session?.role !== "admin") {
      return NextResponse.json({
        storeName: settings.storeName,
        paymentGateway: settings.paymentGateway,
        hiddenGateways: normalizedHiddenGateways,
        currency: settings.currency,
        maintenanceMode: rawSettings.maintenanceMode || false,
        maintenanceMessage: rawSettings.maintenanceMessage || "We're performing maintenance.",
      });
    }

    return NextResponse.json({
      ...settings,
      hiddenGateways: normalizedHiddenGateways,
      supportedGateways: SUPPORTED_GATEWAYS,
      supportedAIProviders: SUPPORTED_AI_PROVIDERS,
      databaseProvider: "sqlite",
      maintenanceMode: rawSettings.maintenanceMode || false,
      maintenanceMessage: rawSettings.maintenanceMessage || "We're performing maintenance.",
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST - Update settings in database
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentGateway, aiProvider, storeName, currency, taxRate, hiddenGateways, maintenanceMode, maintenanceMessage } = body;
    const normalizedHiddenGateways = normalizeHiddenGateways(hiddenGateways);

    // Validate gateway
    if (paymentGateway && !SUPPORTED_GATEWAYS.includes(paymentGateway)) {
      return NextResponse.json(
        { error: `Unsupported gateway: ${paymentGateway}. Supported: ${SUPPORTED_GATEWAYS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate AI Provider
    if (aiProvider && !SUPPORTED_AI_PROVIDERS.includes(aiProvider)) {
      return NextResponse.json(
        { error: `Unsupported AI provider: ${aiProvider}. Supported: ${SUPPORTED_AI_PROVIDERS.join(", ")}` },
        { status: 400 }
      );
    }

    // Get existing settings to preserve fields not being updated
    const existing = await prisma.siteSettings.findUnique({ where: { id: "global" } });

    const updateData: Record<string, unknown> = {};
    if (paymentGateway !== undefined) updateData.paymentGateway = paymentGateway;
    if (aiProvider !== undefined) updateData.aiProvider = aiProvider;
    if (storeName !== undefined) updateData.storeName = storeName;
    if (currency !== undefined) updateData.currency = currency;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    if (hiddenGateways !== undefined) updateData.hiddenGateways = JSON.stringify(normalizedHiddenGateways);
    if (typeof maintenanceMode === "boolean") updateData.maintenanceMode = maintenanceMode;
    if (typeof maintenanceMessage === "string") updateData.maintenanceMessage = maintenanceMessage;

    // If no fields to update, return success
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes to save.",
        data: {
          ...existing,
          hiddenGateways: normalizedHiddenGateways,
        }
      });
    }

    let updated;
    if (existing) {
      updated = await prisma.siteSettings.update({
        where: { id: "global" },
        data: updateData,
      });
    } else {
      updated = await prisma.siteSettings.create({
        data: {
          id: "global",
          paymentGateway: paymentGateway || "stripe",
          hiddenGateways: JSON.stringify(normalizedHiddenGateways),
          aiProvider: aiProvider || "gemini",
          storeName: storeName || "Koda Store",
          currency: currency || "USD",
          taxRate: taxRate || 0,
          maintenanceMode: maintenanceMode || false,
          maintenanceMessage: maintenanceMessage || "We're performing maintenance.",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Settings saved. Active gateway: ${updated.paymentGateway} | Active AI: ${updated.aiProvider}`,
      data: {
        ...updated,
        hiddenGateways: normalizeHiddenGateways((updated as { hiddenGateways?: string | null }).hiddenGateways),
      }
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
