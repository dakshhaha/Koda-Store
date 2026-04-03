import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getSession();
    if (session?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getSession();
    if (session?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...body,
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        salePrice: body.salePrice !== undefined ? (body.salePrice ? parseFloat(body.salePrice) : null) : undefined,
        stock: body.stock !== undefined ? parseInt(body.stock) : undefined,
        featured: body.featured !== undefined ? !!body.featured : undefined,
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const session = await getSession();
    if (session?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
