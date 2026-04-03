import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { 
      email, 
      password, 
      name, 
      phone, 
      address, 
      city, 
      zip, 
      country,
      referralCode,
    } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, Password, and Identity are mandatory." }, { status: 400 });
    }

    // Check availability
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Identity already registered." }, { status: 400 });
    }

    // Secure encryption
    const passwordHash = await bcrypt.hash(password, 12);

    // Find referrer by matching the code against user.id substrings
    let referrerId: string | null = null;
    if (referralCode && typeof referralCode === "string") {
      const normalizedCode = referralCode.trim().toUpperCase();
      // Only query users whose ID starts with the referral code pattern
      const matchingUsers = await prisma.user.findMany({
        select: { id: true },
        where: {
          id: {
            startsWith: normalizedCode.toLowerCase(),
          },
        },
      });
      const matchingUser = matchingUsers.find(
        (u) => u.id.substring(0, 8).toUpperCase() === normalizedCode
      );
      if (matchingUser) {
        referrerId = matchingUser.id;
        console.log("Referral matched:", { referrerId, code: normalizedCode });
      } else {
        console.log("Referral code not matched:", { code: normalizedCode, found: matchingUsers.length });
      }
    }

    // Create user in a transaction if there's a referral
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone,
          address,
          city,
          zip,
          country,
          role: "customer",
          locale: "en-US",
          currency: country === "IN" ? "INR" : country === "GB" ? "GBP" : "USD",
        },
      });

      // Record referral and award 100 Aura coins to referrer on registration
      if (referrerId && referrerId !== created.id) {
        await tx.referral.create({
          data: {
            referrerId,
            referredId: created.id,
            status: "registered",
            rewardAwarded: false,
          },
        });

        // Award 100 Aura coins immediately on registration
        await tx.user.update({
          where: { id: referrerId },
          data: { auraCoins: { increment: 100 } },
        });
      }

      return created;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Curation account initialized successfully.",
      user: { id: user.id, email: user.email, name: user.name } 
    });
  } catch (error: any) {
    console.error("Signup internal error:", error);
    return NextResponse.json({ error: "Internal server error during account creation." }, { status: 500 });
  }
}
