import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, rating, comment } = await request.json();

    if (!productId || !rating) {
      return NextResponse.json({ error: "Product and Rating are required." }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.userId,
        rating: Math.max(1, Math.min(5, rating)),
        comment
      },
      include: { user: { select: { name: true } } }
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Review creation failed:", error);
    return NextResponse.json({ error: "Feedback persistent request failed." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) return NextResponse.json({ error: "Product identifier needed." }, { status: 400 });

  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Failed to fetch feedback." }, { status: 500 });
  }
}
