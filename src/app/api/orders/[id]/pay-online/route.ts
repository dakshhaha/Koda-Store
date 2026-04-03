import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPaymentGateway, SUPPORTED_GATEWAYS, type PaymentGatewayName } from "@/lib/payment";
import { normalizeCurrency } from "@/lib/currency";

function parseHiddenGateways(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((gateway): gateway is string => typeof gateway === "string");
    }
  } catch {
    return [];
  }
  return [];
}

function isPaidStatus(status: string | undefined): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return ["paid", "succeeded", "completed", "captured", "successful", "complete"].includes(normalized);
}

function pickOnlineGateway(
  requested: PaymentGatewayName | undefined,
  preferred: PaymentGatewayName | undefined,
  hiddenGateways: string[]
): PaymentGatewayName | null {
  const supportedCheckoutGateways: PaymentGatewayName[] = ["stripe", "razorpay", "paypal", "flutterwave"];
  const visibleOnlineGateways = SUPPORTED_GATEWAYS.filter(
    (gateway): gateway is PaymentGatewayName =>
      supportedCheckoutGateways.includes(gateway) && !hiddenGateways.includes(gateway)
  );
  if (visibleOnlineGateways.length === 0) return null;

  if (requested && requested !== "cod" && visibleOnlineGateways.includes(requested)) {
    return requested;
  }

  if (preferred && preferred !== "cod" && visibleOnlineGateways.includes(preferred)) {
    return preferred;
  }

  return visibleOnlineGateways[0];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const requestedGateway = (typeof body.gateway === "string" ? body.gateway : undefined) as PaymentGatewayName | undefined;
    const locale = typeof body.locale === "string" && body.locale ? body.locale : "en-US";

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const normalizedStatus = String(order.status || "").toLowerCase();
    if (["paid", "shipped", "delivered"].includes(normalizedStatus)) {
      return NextResponse.json({ error: "This order is already paid." }, { status: 400 });
    }

    const canInitializePayment = ["pending", "failed", "cancelled"].includes(normalizedStatus);
    if (!canInitializePayment) {
      return NextResponse.json({ error: "Online payment is not available for this order state." }, { status: 400 });
    }

    const settings = await prisma.siteSettings.findUnique({ where: { id: "global" } });
    const hiddenGateways = parseHiddenGateways((settings as { hiddenGateways?: string | null } | null)?.hiddenGateways);
    const preferredGateway = settings?.paymentGateway as PaymentGatewayName | undefined;
    const gatewayName = pickOnlineGateway(requestedGateway, preferredGateway, hiddenGateways);

    if (!gatewayName) {
      return NextResponse.json({ error: "No online payment gateways are currently enabled." }, { status: 400 });
    }

    const amount = Number(order.total || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Order total is invalid for online payment." }, { status: 400 });
    }

    const normalizedCurrency = normalizeCurrency(
      typeof body.currency === "string" && body.currency
        ? body.currency
        : order.currency || settings?.currency || "USD"
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const returnUrl = `${appUrl}/${locale}/orders/${order.id}/receipt`;
    const cancelUrl = `${appUrl}/${locale}/orders/${order.id}/track?payment=cancelled`;

    const paymentGateway = getPaymentGateway(gatewayName);
    const payment = await paymentGateway.createPayment({
      amount,
      currency: normalizedCurrency,
      returnUrl,
      cancelUrl,
      metadata: {
        orderId: order.id,
        orderLabel: `Order ${order.id.slice(0, 8).toUpperCase()}`,
        customerEmail: session.email,
        customerName: session.name,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentGateway: gatewayName,
        currency: normalizedCurrency,
        paymentId: payment.id,
        status: isPaidStatus(payment.status) ? "paid" : "pending",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      gateway: gatewayName,
      amount,
      currency: normalizedCurrency,
      payment,
    });
  } catch (error) {
    console.error("Pay-online initialization failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to initialize online payment." },
      { status: 500 }
    );
  }
}
