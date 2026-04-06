import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "support")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID." }, { status: 400 });

    const supportSession = await prisma.supportSession.findUnique({
      where: { id },
      include: {
        chatMessages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true, isHuman: true, createdAt: true },
        },
      },
    });

    if (!supportSession) return NextResponse.json({ error: "Not found." }, { status: 404 });

    return NextResponse.json({ 
       chatMessages: supportSession.chatMessages,
       status: supportSession.status 
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch session." }, { status: 500 });
  }
}
