import { NextResponse } from "next/server";
import { getSession, logout } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ authenticated: false });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordChangedAt: true, auraCoins: true }
    });

    if (user?.passwordChangedAt) {
      const changedTime = new Date(user.passwordChangedAt).getTime();
      if (session.iat) {
        const issuedTime = session.iat * 1000;
        if (issuedTime < changedTime) {
          // ACTUALLY clear the session cookie on the server
          await logout();
          return NextResponse.json({ authenticated: false, forcedLogout: true });
        }
      }
    }

    return NextResponse.json({ authenticated: true, user: { ...session, auraCoins: user?.auraCoins || 0 } });
  } catch (err: any) {
    console.error("[AUTH_STATUS_ERROR]", err.message, err.stack);
    return NextResponse.json({ error: "Check failed", details: err.message }, { status: 500 });
  }
}
