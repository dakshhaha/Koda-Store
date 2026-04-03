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
