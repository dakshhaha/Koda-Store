import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCouponCode, validateCouponForSubtotal } from "@/lib/coupons";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subtotal = Number(body?.subtotal || 0);
    const rawCode = String(body?.code || "");
    const code = normalizeCouponCode(rawCode);

    if (!code) {
      return NextResponse.json({ valid: false, error: "Enter a coupon code." }, { status: 400 });
    }

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json({ valid: false, error: "Cart subtotal is invalid." }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    const result = validateCouponForSubtotal(coupon, subtotal);

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.message, code }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code,
      discountAmount: result.discountAmount,
      finalTotal: result.finalTotal,
      message: result.message,
    });
  } catch (error) {
    console.error("Coupon validation failed:", error);
    return NextResponse.json({ valid: false, error: "Unable to validate coupon." }, { status: 500 });
  }
}
