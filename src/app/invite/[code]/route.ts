import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  
  // Default to en-US for the invite landing if locale is unknown
  // The signup page will pick up the ?invite query param
  const url = new URL(request.url);
  const redirectUrl = new URL(`/en-US/auth/signup`, url.origin);
  redirectUrl.searchParams.set("invite", code.toUpperCase());
  
  return NextResponse.redirect(redirectUrl);
}
