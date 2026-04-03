import { NextRequest, NextResponse } from "next/server";

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: "INR",
  GB: "GBP",
  NG: "NGN",
  CA: "CAD",
  AU: "AUD",
  JP: "JPY",
  DE: "EUR",
  FR: "EUR",
  BR: "BRL",
  US: "USD",
  AE: "AED",
  SG: "SGD",
  MY: "MYR",
  PH: "PHP",
  ZA: "ZAR",
  KE: "KES",
  EG: "EGP",
  PK: "PKR",
  BD: "BDT",
  NP: "NPR",
};

function fallbackGeo() {
  return {
    country: "United States",
    countryCode: "US",
    city: "",
    region: "",
    zip: "",
    lat: null,
    lon: null,
    currency: "USD",
  };
}

export async function GET(request: NextRequest) {
  try {
    const headerCountry =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-country-code") ||
      "";

    if (headerCountry) {
      return NextResponse.json({
        country: request.headers.get("x-vercel-ip-country-name") || "",
        countryCode: headerCountry,
        city: request.headers.get("x-vercel-ip-city") || "",
        region: request.headers.get("x-vercel-ip-country-region") || "",
        zip: request.headers.get("x-vercel-ip-postal-code") || "",
        lat: null,
        lon: null,
        currency: COUNTRY_TO_CURRENCY[headerCountry] || "USD",
      });
    }

    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim();
    const lookupUrl = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";

    const response = await fetch(lookupUrl, { next: { revalidate: 300 } });
    const data = await response.json();

    if (data?.country_code) {
      return NextResponse.json({
        country: data.country_name || "",
        countryCode: data.country_code,
        city: data.city || "",
        region: data.region || "",
        zip: data.postal || "",
        lat: data.latitude || null,
        lon: data.longitude || null,
        currency: data.currency || COUNTRY_TO_CURRENCY[data.country_code] || "USD",
      });
    }

    return NextResponse.json(fallbackGeo());
  } catch {
    return NextResponse.json(fallbackGeo());
  }
}
