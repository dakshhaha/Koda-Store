import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    console.log("Fetching referrals for userId:", session.userId);

    const referrals = await prisma.referral.findMany({
      where: { referrerId: session.userId },
      include: {
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("Found referrals:", referrals.length, JSON.stringify(referrals.map(r => ({ id: r.id, status: r.status, referredId: r.referredId, referrerId: r.referrerId }))));

    const totalReferrals = referrals.length;
    const registeredCount = referrals.filter((r) => r.status === "registered" || r.status === "completed").length;
    const rewardedCount = referrals.filter((r) => r.rewardAwarded).length;

    return NextResponse.json({
      success: true,
      totalReferrals,
      registeredCount,
      rewardedCount,
      referrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        rewardAwarded: r.rewardAwarded,
        createdAt: r.createdAt,
        referred: r.referred,
      })),
    });
  } catch (error: any) {
    console.error("Referrals stats error:", error);
    return NextResponse.json({ error: "Failed to load referral stats." }, { status: 500 });
  }
}
