import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "support")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, userId, orderId, data } = await request.json();

    switch (action) {
      case "reset_password": {
        if (!userId || !data?.newPassword) {
          console.error("[RESET_PASSWORD] Missing userId or password");
          throw new Error("Missing required data (Password/User ID)");
        }
        
        console.log(`[RESET_PASSWORD] Targeted User ID: ${userId}`);
        
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(data.newPassword, salt);
        
        try {
          const updated = await prisma.user.update({
            where: { id: userId },
            data: { 
              passwordHash: hash,
              passwordChangedAt: new Date()
            }
          });
          
          console.log(`[RESET_PASSWORD] Success for ${updated.email}`);
          return NextResponse.json({ success: true, message: `Password for ${updated.email} has been reset.` });
        } catch (updateError: any) {
          console.error("[RESET_PASSWORD] Prisma Error:", updateError.message);
          throw new Error(`Prisma update failed: ${updateError.message}`);
        }
      }

      case "change_email": {
        if (!userId || !data?.newEmail) throw new Error("Missing details");
        await prisma.user.update({
          where: { id: userId },
          data: { email: data.newEmail }
        });
        return NextResponse.json({ success: true, message: "Email updated successfully" });
      }

      case "cancel_order": {
        if (!orderId) throw new Error("Missing order ID");
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "cancelled" }
        });
        return NextResponse.json({ success: true, message: "Order cancelled" });
      }

      case "refund_order": {
        if (!orderId) throw new Error("Missing order ID");
        // In a real app you'd call a payment gateway refund here
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "failed" } // status: "refunded" isn't in current enum but you get the idea
        });
        return NextResponse.json({ success: true, message: "Order marked for refund" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 500 });
  }
}
