import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    if (!amount || amount === 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ success: false });

    const user = await prisma.user.update({
      where: { id: session.userId },
      // @ts-ignore - TS language server might be out of sync with Prisma schema
      data: { auraCoins: { increment: amount } }
    });

    // @ts-ignore
    return NextResponse.json({ success: true, newBalance: user.auraCoins });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}
