import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    const order = await prisma.order.findFirst({
      where: { id, userId: session.userId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const normalizedStatus = order.status.toLowerCase();
    if (!["paid", "shipped"].includes(normalizedStatus)) {
      return NextResponse.json({ error: "Refund can only be requested for paid or shipped orders." }, { status: 400 });
    }

    await prisma.order.update({
      where: { id },
      data: { status: "failed" },
    });

    return NextResponse.redirect(new URL(request.headers.get("referer") || "/"));
  } catch (error) {
    console.error("Refund order error:", error);
    return NextResponse.json({ error: "Failed to request refund." }, { status: 500 });
  }
}
