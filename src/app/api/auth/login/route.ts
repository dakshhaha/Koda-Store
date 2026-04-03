import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Curandero credentials missing." }, { status: 400 });
    }

    // Secure Retrieval
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Identity not recognized." }, { status: 401 });
    }

    // Hash Verification
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Credential mismatch." }, { status: 401 });
    }

    // Initialize Secure Session
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await encrypt({ 
      userId: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name || user.email.split('@')[0],
    });

    // Finalize Authorization
    (await cookies()).set(SESSION_COOKIE_NAME, session, { 
      expires, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production" 
    });

    return NextResponse.json({ 
      success: true, 
      message: "Authorized.",
      user: { id: user.id, email: user.email, name: user.name, role: user.role } 
    });
  } catch (error) {
    console.error("Login authorization error:", error);
    return NextResponse.json({ error: "Internal coordination failure." }, { status: 500 });
  }
}
