import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { 
      id,
      addressLine1, 
      addressLine2, 
      city, 
      state, 
      zip, 
      country, 
      type = "shipping", 
      isDefault = false 
    } = await request.json();

    if (id) {
       // Update
       await prisma.address.updateMany({
         where: { id, userId: session.userId },
         data: { addressLine1, addressLine2, city, state, zip, country, type, isDefault }
       });
       const updated = await prisma.address.findFirst({ where: { id, userId: session.userId } });
       if (!updated) return NextResponse.json({ error: "Address not found" }, { status: 404 });
       if (isDefault) await resetOtherDefaults(session.userId, id);
       return NextResponse.json(updated);
    }

    // Create
    const newAddress = await prisma.address.create({
      data: {
        userId: session.userId,
        addressLine1,
        addressLine2,
        city,
        state,
        zip,
        country,
        type,
        isDefault
      }
    });

    if (isDefault) await resetOtherDefaults(session.userId, newAddress.id);

    return NextResponse.json(newAddress);
  } catch (error) {
    console.error("Address operation failed:", error);
    return NextResponse.json({ error: "Database rejected the coordination request." }, { status: 500 });
  }
}

async function resetOtherDefaults(userId: string, currentId: string) {
  await prisma.address.updateMany({
    where: { userId, id: { not: currentId } },
    data: { isDefault: false }
  });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const addresses = await prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch curandero registry." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
      const session = await getSession();
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const { id } = await request.json();
      await prisma.address.deleteMany({ where: { id, userId: session.userId } });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Deletion failed." }, { status: 500 });
    }
}
