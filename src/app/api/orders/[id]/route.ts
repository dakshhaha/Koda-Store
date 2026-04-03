import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { id, userId: session.userId },
      include: { items: { include: { product: true } } }
    });

    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load order." }, { status: 500 });
  }
}
