import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Security check: Only allow proxying Google Maps API requests
  if (!targetUrl.startsWith("https://maps.googleapis.com/")) {
    return NextResponse.json({ error: "Invalid target URL" }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Google API responded with status ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Proxy request failed" },
      { status: 500 }
    );
  }
}
