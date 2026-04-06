import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Fetch user's cart
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                salePrice: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const items = cart.items.map((item) => {
      const images = Array.isArray(item.product.images) ? item.product.images : [];
      const effectivePrice = item.product.salePrice ?? item.product.price;
      return {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: effectivePrice,
        quantity: item.quantity,
        image: (images[0] as string) || "/placeholder.png",
        stock: item.product.stock,
      };
    });

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { productId, quantity = 1 } = await request.json();

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    if (typeof quantity !== "number" || quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    // Verify product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    // Upsert cart
    const cart = await prisma.cart.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {},
    });

    // Upsert cart item
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity },
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
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.userId },
    });

    if (!cart) {
      return NextResponse.json({ success: true }); // No cart, nothing to remove
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}
