import { NextResponse } from "next/server";
import { getPaymentGateway, type PaymentGatewayName } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createHmac } from "node:crypto";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, gateway, orderId, razorpayOrderId, razorpaySignature } = body;

    if (!paymentId && !orderId) {
      return NextResponse.json({ error: "Payment ID or order ID is required" }, { status: 400 });
    }

    const order = orderId
      ? await prisma.order.findFirst({ where: { id: orderId, userId: session.userId } })
      : await prisma.order.findFirst({ where: { paymentId, userId: session.userId } });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const gatewayName = (gateway || order.paymentGateway) as PaymentGatewayName;
    const paymentGateway = getPaymentGateway(gatewayName);
    const effectivePaymentId = paymentId || order.paymentId;

    if (!effectivePaymentId) {
      return NextResponse.json({ error: "Payment ID is missing for this order" }, { status: 400 });
    }

    const normalizedPaymentId = Array.isArray(effectivePaymentId) ? effectivePaymentId[0] : effectivePaymentId;
    if (typeof normalizedPaymentId !== "string") {
      return NextResponse.json({ error: "Invalid payment identifier" }, { status: 400 });
    }

    if (gatewayName === "razorpay") {
      if (!razorpayOrderId || !razorpaySignature) {
        return NextResponse.json({ error: "Razorpay signature data is required." }, { status: 400 });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return NextResponse.json({ error: "Razorpay secret key is missing." }, { status: 500 });
      }

      const expectedSignature = createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${normalizedPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "pending" },
        });
        return NextResponse.json({ error: "Payment signature mismatch." }, { status: 400 });
      }
    }

    const result = await paymentGateway.verifyPayment(normalizedPaymentId);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: normalizedPaymentId,
        paymentGateway: gatewayName,
        status: result.verified ? "paid" : "pending",
      },
    });

    return NextResponse.json({
      success: result.verified,
      ...result,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}
