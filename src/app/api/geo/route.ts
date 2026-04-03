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

const INDIAN_STATES: Record<string, string> = {
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CG: "Chhattisgarh",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OD: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TG: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  WB: "West Bengal",
  AN: "Andaman and Nicobar Islands",
  CH: "Chandigarh",
  DN: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  JK: "Jammu and Kashmir",
  LA: "Ladakh",
  LD: "Lakshadweep",
  PY: "Puducherry"
};

function safeDecode(str: string | null) {
  if (!str) return "";
  try { return decodeURIComponent(str); } catch { return str; }
}

export async function GET(request: NextRequest) {
  try {
    const headerCountry =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-country-code") ||
      "";

    if (headerCountry) {
      let region = safeDecode(request.headers.get("x-vercel-ip-country-region"));
      if (headerCountry === "IN" && INDIAN_STATES[region]) {
        region = INDIAN_STATES[region];
      }
      return NextResponse.json({
        country: safeDecode(request.headers.get("x-vercel-ip-country-name")) || "",
        countryCode: headerCountry,
        city: safeDecode(request.headers.get("x-vercel-ip-city")),
        region: region,
        zip: safeDecode(request.headers.get("x-vercel-ip-postal-code")),
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
