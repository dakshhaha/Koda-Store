import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json({ error: "Latitude and longitude are required." }, { status: 400 });
    }

    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const res = await fetch(reverseUrl, {
      headers: {
        "User-Agent": "KodaStoreLocation/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Reverse geocoding failed." }, { status: 502 });
    }

    const data = await res.json();
    const address = data?.address || {};
    const countryCode = String(address.country_code || "US").toUpperCase();

    const streetLine = [address.house_number, address.road].filter(Boolean).join(" ").trim();
    const city = address.city || address.town || address.village || address.county || "";
    const state = address.state || address.region || "";
    const zip = address.postcode || "";

    return NextResponse.json({
      countryCode,
      city,
      state,
      zip,
      addressLine1: streetLine,
      displayName: data?.display_name || "",
      lat: data?.lat || lat,
      lon: data?.lon || lon,
    });
  } catch {
    return NextResponse.json({ error: "Unable to resolve your location." }, { status: 500 });
  }
}
