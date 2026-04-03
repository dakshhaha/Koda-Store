export interface CouponRecord {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  discountAmount: number;
  finalTotal: number;
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validateCouponWindow(coupon: CouponRecord, now = new Date()): string | null {
  if (!coupon.active) return "This coupon is inactive.";
  if (coupon.startsAt && now < coupon.startsAt) return "This coupon is not active yet.";
  if (coupon.endsAt && now > coupon.endsAt) return "This coupon has expired.";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "This coupon has reached its usage limit.";
  return null;
}

export function calculateDiscount(coupon: CouponRecord, subtotal: number): number {
  const safeSubtotal = Math.max(0, subtotal);

  if (safeSubtotal <= 0) return 0;
  if (safeSubtotal < coupon.minOrder) return 0;

  let discount = 0;
  if (coupon.discountType === "percent") {
    discount = (safeSubtotal * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }

  if (coupon.maxDiscount !== null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  return Math.max(0, Math.min(discount, safeSubtotal));
}

export function validateCouponForSubtotal(coupon: CouponRecord | null, subtotal: number): CouponValidationResult {
  if (!coupon) {
    return {
      valid: false,
      message: "Coupon not found.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  const windowError = validateCouponWindow(coupon);
  if (windowError) {
    return {
      valid: false,
      message: windowError,
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  if (subtotal < coupon.minOrder) {
    return {
      valid: false,
      message: `Minimum order amount is ${coupon.minOrder.toFixed(2)} for this coupon.`,
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  const discountAmount = calculateDiscount(coupon, subtotal);
  if (discountAmount <= 0) {
    return {
      valid: false,
      message: "Coupon is not applicable for this cart.",
      discountAmount: 0,
      finalTotal: subtotal,
    };
  }

  return {
    valid: true,
    message: "Coupon applied successfully.",
    discountAmount,
    finalTotal: Math.max(0, subtotal - discountAmount),
  };
}
