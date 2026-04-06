import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "support")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.supportSession.findMany({
      where: { status: { in: ["human_needed", "agent_active"] } },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        chatMessages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
