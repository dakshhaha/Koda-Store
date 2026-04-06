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
    if (!["paid", "pending"].includes(normalizedStatus)) {
      return NextResponse.json({ error: "Order cannot be marked as shipped from its current status." }, { status: 400 });
    }

    const shippedOrder = await prisma.order.update({
      where: { id },
      data: { status: "shipped" },
    });

    return NextResponse.json({
      success: true,
      message: "Order marked as shipped.",
      orderId: shippedOrder.id,
      status: shippedOrder.status,
    });
  } catch (error) {
    console.error("Mark as shipped error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark order as shipped." },
      { status: 500 }
    );
  }
}
