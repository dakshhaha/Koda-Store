import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { currency: "USD" },
      select: { id: true, currency: true, total: true, paymentGateway: true },
    });

    const updated: string[] = [];
    for (const order of orders) {
      if (order.paymentGateway === "razorpay" || order.paymentGateway === "cod") {
        await prisma.order.update({
          where: { id: order.id },
          data: { currency: "INR" },
        });
        updated.push(order.id.substring(0, 8));
      }
    }

    return NextResponse.json({
      success: true,
      totalChecked: orders.length,
      updated: updated.length,
      updatedIds: updated,
    });
  } catch (error: any) {
    console.error("Currency fix error:", error);
    return NextResponse.json({ error: "Failed to fix currency." }, { status: 500 });
  }
}
