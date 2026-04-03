import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPaymentGateway, SUPPORTED_GATEWAYS, type PaymentGatewayName } from "@/lib/payment";
import { normalizeCouponCode, validateCouponForSubtotal } from "@/lib/coupons";
import { convertUsdToCurrency, normalizeCurrency } from "@/lib/currency";

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

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const userExists = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json({ error: "Unauthorized: User not found. Please log in again." }, { status: 401 });
    }

    const { currency, gateway, shippingDetails, cartItems, couponCode } = await request.json();

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const normalizedCartItems = (cartItems as Array<{ id: string; quantity: number }>).map((item) => ({
      id: String(item.id || "").trim(),
      quantity: Number(item.quantity || 0),
    }));

    if (normalizedCartItems.some((item) => !item.id || !Number.isFinite(item.quantity) || item.quantity <= 0)) {
      return NextResponse.json({ error: "Cart contains invalid items." }, { status: 400 });
    }

    const productIds = Array.from(new Set(normalizedCartItems.map((item) => item.id)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, salePrice: true, stock: true },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    let subtotalUsd = 0;
    let cartValidationError = "";
    const missingProductIds: string[] = [];

    const normalizedOrderItemsUsd = normalizedCartItems.map((item) => {
      const product = productMap.get(item.id);
      if (!product) {
        missingProductIds.push(item.id);
        return null;
      }

      if (item.quantity > product.stock) {
        cartValidationError = `Some products do not have enough stock for this order.`;
      }

      const unitPrice = product.salePrice ?? product.price;
      subtotalUsd += unitPrice * item.quantity;

      return { productId: item.id, quantity: item.quantity, price: unitPrice };
    }).filter(Boolean);

    if (missingProductIds.length > 0) {
      return NextResponse.json({
        error: "Some items in your cart are no longer available. Please refresh your cart and try again.",
        missingProducts: missingProductIds,
      }, { status: 400 });
    }

    if (cartValidationError) {
      return NextResponse.json({ error: cartValidationError }, { status: 400 });
    }

    const settings = await prisma.siteSettings.findUnique({ where: { id: "global" } });
    const hiddenGateways = parseHiddenGateways((settings as { hiddenGateways?: string | null } | null)?.hiddenGateways);
    const requestedGateway = (gateway || settings?.paymentGateway || "stripe") as PaymentGatewayName;
    const normalizedCurrency = normalizeCurrency(
      typeof currency === "string" && currency ? currency : settings?.currency || "USD"
    );

    if (!SUPPORTED_GATEWAYS.includes(requestedGateway)) {
      return NextResponse.json({ error: `Unsupported gateway: ${requestedGateway}` }, { status: 400 });
    }

    if (hiddenGateways.includes(requestedGateway)) {
      return NextResponse.json({ error: `${requestedGateway} is disabled by admin settings.` }, { status: 400 });
    }

    let discountAmountUsd = 0;
    let appliedCoupon: { id: string; code: string } | null = null;

    const normalizedCouponCode = normalizeCouponCode(String(couponCode || ""));
    if (normalizedCouponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCouponCode } });
      const couponResult = validateCouponForSubtotal(coupon, subtotalUsd);

      if (!couponResult.valid || !coupon) {
        return NextResponse.json({ error: couponResult.message || "Coupon is invalid." }, { status: 400 });
      }

      discountAmountUsd = couponResult.discountAmount;
      appliedCoupon = { id: coupon.id, code: coupon.code };
    }

    const finalTotalUsd = Math.max(0, subtotalUsd - discountAmountUsd);

    const subtotal = convertUsdToCurrency(subtotalUsd, normalizedCurrency);
    const discountAmount = convertUsdToCurrency(discountAmountUsd, normalizedCurrency);
    const finalTotal = convertUsdToCurrency(finalTotalUsd, normalizedCurrency);

    const normalizedOrderItems = (normalizedOrderItemsUsd as Array<{ productId: string; quantity: number; price: number }>).map((item) => ({
      ...item,
      price: convertUsdToCurrency(item.price, normalizedCurrency),
    }));

    if (finalTotalUsd <= 0) {
      return NextResponse.json({ error: "Order total must be greater than zero." }, { status: 400 });
    }

    const shippingAddress = [
      shippingDetails?.address,
      shippingDetails?.city,
      shippingDetails?.state,
      shippingDetails?.zip,
      shippingDetails?.country,
    ]
      .filter(Boolean)
      .join(", ");

    const isCod = requestedGateway === "cod";
    const paymentId = isCod ? `cod_${Date.now()}` : null;

    const order = await prisma.order.create({
      data: {
        userId: session.userId,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon?.code || null,
        total: finalTotal,
        status: "pending",
        paymentGateway: requestedGateway,
        paymentId,
        shippingAddress: `${shippingAddress}. Phone: ${shippingDetails?.phone || "N/A"}`,
        items: {
          create: normalizedOrderItems,
        },
      },
    });

    if (isCod) {
      if (appliedCoupon?.id) {
        await prisma.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        payment: {
          id: order.paymentId,
          status: "pending",
          gateway: "cod",
        },
        totals: {
          subtotal,
          discountAmount,
          total: finalTotal,
          couponCode: appliedCoupon?.code || null,
        },
      });
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      const locale = shippingDetails?.locale || "en-US";
      const returnUrl = `${appUrl}/${locale}/orders/${order.id}/receipt`;
      const cancelUrl = `${appUrl}/${locale}/checkout?payment=cancelled&orderId=${order.id}`;

      const paymentGateway = getPaymentGateway(requestedGateway);
      const payment = await paymentGateway.createPayment({
        amount: finalTotal,
        currency: normalizedCurrency,
        returnUrl,
        cancelUrl,
        metadata: {
          orderId: order.id,
          orderLabel: `Order ${order.id.slice(0, 8).toUpperCase()}`,
          customerEmail: shippingDetails?.email || session.email,
          customerName: `${shippingDetails?.firstName || ""} ${shippingDetails?.lastName || ""}`.trim() || session.name,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentId: payment.id,
          status: isPaidStatus(payment.status) ? "paid" : "pending",
        },
      });

      if (appliedCoupon?.id) {
        await prisma.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        payment,
        totals: {
          subtotal,
          discountAmount,
          total: finalTotal,
          couponCode: appliedCoupon?.code || null,
        },
      });
    } catch (gatewayError) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
      throw gatewayError;
    }
  } catch (error) {
    console.error("Payment failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed." },
      { status: 500 }
    );
  }
}
