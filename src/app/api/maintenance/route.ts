import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "global" },
      select: { maintenanceMode: true, maintenanceMessage: true },
    });

    const userSession = await getSession();
    const isAdmin = userSession?.role === "admin";

    return NextResponse.json({
      maintenanceMode: settings?.maintenanceMode || false,
      maintenanceMessage: settings?.maintenanceMessage || "We're currently performing maintenance.",
      isAdmin,
    });
  } catch (error) {
    console.error("Maintenance check error:", error);
    return NextResponse.json({ maintenanceMode: false, maintenanceMessage: "" });
  }
}
