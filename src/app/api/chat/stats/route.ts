import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activeWaitCount = await prisma.supportSession.count({
      where: { status: "human_needed" }
    });

    const agentCount = await prisma.user.count({
      where: { role: { in: ["admin", "support"] } }
    });

    // Simple estimation logic
    // Each agent can handle ~3 concurrent chats, ~5 mins per chat
    const availableAgents = agentCount || 1;
    const estimatedWaitMinutes = Math.max(2, Math.ceil((activeWaitCount / availableAgents) * 5));

    return NextResponse.json({
      activeWaitCount,
      agentCount,
      estimatedWaitMinutes,
      status: agentCount > 0 ? "online" : "limited_availability"
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
