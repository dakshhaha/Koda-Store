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
  const onlineGateways: PaymentGatewayName[] = ["stripe", "razorpay"];
  
  // Filter for supported and not hidden
  let visibleOnlineGateways = onlineGateways.filter(
    (gateway): gateway is PaymentGatewayName =>
      SUPPORTED_GATEWAYS.includes(gateway) && !hiddenGateways.includes(gateway)
  );

  // If everything is hidden, but we are in this route, we MUST provide an online gateway
  // so we fallback to all supported online gateways
  if (visibleOnlineGateways.length === 0) {
    visibleOnlineGateways = onlineGateways.filter(g => SUPPORTED_GATEWAYS.includes(g));
  }
  
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

    // Allow COD orders (paymentGateway === 'cod') and any pending/failed/cancelled order to switch to online payment
    const isCodOrder = String((order as any).paymentGateway || "").toLowerCase() === "cod";
    const canInitializePayment = isCodOrder || ["pending", "failed", "cancelled"].includes(normalizedStatus);
    if (!canInitializePayment) {
      return NextResponse.json({ error: "Online payment is not available for this order state." }, { status: 400 });
    }

    const settings = await prisma.siteSettings.findUnique({ where: { id: "global" } });
    const hiddenGateways = parseHiddenGateways((settings as { hiddenGateways?: string | null } | null)?.hiddenGateways);
    const preferredGateway = settings?.paymentGateway as PaymentGatewayName | undefined;
    
    // Pass hidden gateways, but pickOnlineGateway now has fallback logic
    const gatewayName = pickOnlineGateway(requestedGateway, preferredGateway, hiddenGateways);

    if (!gatewayName) {
      return NextResponse.json({ error: "No online payment gateways are currently enabled." }, { status: 400 });
    }

    const amount = Number(order.total || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Order total is invalid for online payment." }, { status: 400 });
    }

    let normalizedCurrency = normalizeCurrency(
      typeof body.currency === "string" && body.currency
        ? body.currency
        : order.currency || "USD"
    );

    // Razorpay is most stable with INR for typical Indian merchant accounts.
    if (gatewayName === "razorpay" && normalizedCurrency !== "INR") {
      normalizedCurrency = "INR";
    }

    // Recalculate amount if currency changed
    let finalAmount = amount;
    if (normalizedCurrency !== order.currency) {
      const from = order.currency || "USD";
      const { convertCurrency } = await import("@/lib/currency");
      finalAmount = convertCurrency(amount, from, normalizedCurrency);
    }

    // Razorpay max order amount is ₹500,000 (50,000,000 paise)
    if (gatewayName === "razorpay") {
      const amountInPaise = Math.round(finalAmount * 100);
      const maxPaise = 50000000;
      if (amountInPaise > maxPaise) {
        return NextResponse.json({
          error: `Order amount (${finalAmount} ${normalizedCurrency}) exceeds Razorpay's maximum allowed amount. Please contact support for large orders.`
        }, { status: 400 });
      }
      if (amountInPaise <= 0) {
        return NextResponse.json({ error: "Order amount must be greater than zero." }, { status: 400 });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const returnUrl = `${appUrl}/${locale}/orders/${order.id}/receipt`;
    const cancelUrl = `${appUrl}/${locale}/orders/${order.id}/track?payment=cancelled`;

    const paymentGateway = getPaymentGateway(gatewayName);
    const payment = await paymentGateway.createPayment({
      amount: finalAmount,
      currency: normalizedCurrency,
      returnUrl,
      cancelUrl,
      metadata: {
        orderId: order.id,
        orderLabel: `Order ${order.id.slice(0, 8).toUpperCase()}`,
        customerEmail: session.email || "guest@kodastore.com",
        customerName: session.name || "Customer",
      },
    });

    const updatedData: any = {
      paymentGateway: gatewayName,
      currency: normalizedCurrency,
      paymentId: payment.id,
      status: isPaidStatus(payment.status) ? "paid" : "pending",
    };

    // If the currency changed, we MUST convert the numeric values in the database
    // to avoid "Total: 83.2 USD" when it was originally "83.2 INR" (1 USD)
    if (normalizedCurrency !== order.currency) {
      const from = order.currency || "USD";
      const { convertCurrency } = await import("@/lib/currency");
      updatedData.subtotal = convertCurrency(Number(order.subtotal || 0), from, normalizedCurrency);
      updatedData.discountAmount = convertCurrency(Number(order.discountAmount || 0), from, normalizedCurrency);
      updatedData.total = convertCurrency(Number(order.total || 0), from, normalizedCurrency);
      
      // Update individual order item prices too
      const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: {
            price: convertCurrency(Number(item.price || 0), from, normalizedCurrency)
          }
        });
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: updatedData,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      gateway: gatewayName,
      amount: finalAmount,
      currency: normalizedCurrency,
      payment: {
        ...payment,
        amount: finalAmount,
      },
    });
  } catch (error) {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };
    console.error("Pay-online initialization failed:", JSON.stringify(errorDetails, null, 2));
    return NextResponse.json(
      { error: errorDetails.message || "Unable to initialize online payment." },
      { status: 500 }
    );
  }
}
