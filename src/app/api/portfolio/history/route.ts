import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { downsample, getValueHistory } from "@/lib/portfolio/history";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const startParam = request.nextUrl.searchParams.get("start");
  const endParam = request.nextUrl.searchParams.get("end");
  if (!startParam || !endParam) {
    return NextResponse.json({ error: "start und end sind erforderlich." }, { status: 400 });
  }

  const start = new Date(startParam);
  const end = new Date(endParam);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Ungültiger Zeitraum." }, { status: 400 });
  }

  const series = await getValueHistory(session.user.id, start, end);
  return NextResponse.json({ series: downsample(series) });
}
