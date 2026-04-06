import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Fetch user's cart
// GET: Fetch user's cart
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const cart = await (prisma as any).cart.findUnique({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true },
            },
            variant: {
              select: { id: true, name: true, priceOverride: true, stock: true },
            },
          },
        },
      },
    });

    if (!cart) return NextResponse.json({ items: [], total: 0 });

    const items = (cart.items as any[]).map((item: any) => {
      const images = Array.isArray(item.product.images) ? item.product.images : [];
      const basePrice = item.product.salePrice ?? item.product.price;
      const effectivePrice = item.variant?.priceOverride ?? basePrice;
      
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.variant ? `${item.product.name} (${item.variant.name})` : item.product.name,
        slug: item.product.slug,
        price: effectivePrice,
        quantity: item.quantity,
        image: (images[0] as string) || "/placeholder.png",
        stock: item.variant ? item.variant.stock : (item.product as any).stock,
      };
    });

    const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

// POST: Add or update item in cart
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { productId, variantId, quantity = 1 } = await request.json();

    if (!productId) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    // Verify product/variant existence and stock
    if (variantId) {
      const variant = await (prisma as any).productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true }
      });
      if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
      if (variant.stock < quantity) return NextResponse.json({ error: "Insufficient variant stock" }, { status: 400 });
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true }
      });
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      if ((product as any).stock < quantity) return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const cart = await (prisma as any).cart.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {},
    });

    // Upsert cart item with composite key support
    await (prisma as any).cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId || null
        }
      },
      create: { cartId: cart.id, productId, variantId: variantId || null, quantity },
      update: { quantity: { increment: quantity } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

// DELETE: Remove item from cart
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { cartItemId } = await request.json();

    await (prisma as any).cartItem.delete({
      where: { id: cartItemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}
