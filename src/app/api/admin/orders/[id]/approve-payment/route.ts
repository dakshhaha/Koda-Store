import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const normalizedStatus = String(order.status || "").toLowerCase();
    if (["paid", "shipped", "delivered"].includes(normalizedStatus)) {
      return NextResponse.json({ error: "Order payment is already approved." }, { status: 400 });
    }

    const approvedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "paid",
        paymentId: order.paymentId || `manual_approval_${Date.now()}`,
      },
    });

    // Check if this user was referred and award remaining 400 coins on first delivered order
    // (100 already awarded on registration, 400 more on first delivery)
    const referral = await prisma.referral.findFirst({
      where: {
        referredId: order.userId,
        status: "registered",
        rewardAwarded: false,
      },
    });

    if (referral) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: "completed", rewardAwarded: true },
      });

      // Award remaining 400 coins to the referrer
      await prisma.user.update({
        where: { id: referral.referrerId },
        data: { auraCoins: { increment: 400 } },
      });

      console.log("Referral reward completed:", { referralId: referral.id, referrerId: referral.referrerId, additionalCoins: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment approved successfully.",
      orderId: approvedOrder.id,
      status: approvedOrder.status,
    });
  } catch (error) {
    console.error("Approve payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to approve payment." },
      { status: 500 }
    );
  }
}
