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
      country 
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

    // Initial Curator Persistence
    const user = await prisma.user.create({
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
        locale: "en-US", // Default to initial signup locale
        currency: country === "IN" ? "INR" : country === "GB" ? "GBP" : "USD",
      },
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
