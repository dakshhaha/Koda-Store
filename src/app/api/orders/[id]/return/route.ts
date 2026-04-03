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

    if (order.status.toLowerCase() !== "delivered") {
      return NextResponse.json({ error: "Returns can only be initiated for delivered orders." }, { status: 400 });
    }

    await prisma.order.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.redirect(new URL(request.headers.get("referer") || "/"));
  } catch (error) {
    console.error("Return order error:", error);
    return NextResponse.json({ error: "Failed to initiate return." }, { status: 500 });
  }
}
