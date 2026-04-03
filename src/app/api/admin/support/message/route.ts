import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "support")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { sessionId, content } = await request.json();

    if (!sessionId || !content) {
      return NextResponse.json({ error: "Missing session or content." }, { status: 400 });
    }

    const supportSession = await prisma.supportSession.findUnique({
      where: { id: sessionId }
    });

    if (!supportSession) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const messages = JSON.parse(supportSession.messages || "[]");
    messages.push({
      role: "assistant",
      content: content,
      timestamp: new Date().toISOString(),
      isHuman: true
    });

    await prisma.supportSession.update({
      where: { id: sessionId },
      data: {
        messages: JSON.stringify(messages),
        status: "agent_active" // Agent is now talking, customer can reply
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support message error:", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "support")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { sessionId } = await request.json();

    await prisma.supportSession.update({
      where: { id: sessionId },
      data: { status: "resolved" }
    });

    return NextResponse.json({ success: true });
  } catch {
     return NextResponse.json({ error: "Failed to resolve session." }, { status: 500 });
  }
}
