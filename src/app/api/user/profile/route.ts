import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, address, city, state, zip, country, locale, currency } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        zip,
        country,
        ...(locale ? { locale } : {}),
        ...(currency ? { currency } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        country: true,
        locale: true,
        currency: true,
        role: true,
        auraCoins: true,
        addresses: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
