import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/stats/timeseries?readerName=&weeks=10&anchorMonth=YYYY-MM
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const readerName = searchParams.get("readerName") ?? undefined;
  const weeks = Math.max(1, Math.min(52, Number(searchParams.get("weeks") ?? "10")));
  const anchorMonth = searchParams.get("anchorMonth") ?? undefined; // YYYY-MM

  function startOfSunday(d: Date): Date {
    const dd = new Date(d);
    const day = dd.getDay();
    const diff = day; // since Sunday
    dd.setHours(0, 0, 0, 0);
    dd.setDate(dd.getDate() - diff);
    return dd;
  }

  let endSunday: Date;
  if (anchorMonth) {
    const anchorDate = new Date(`${anchorMonth}-01T00:00:00`);
    const today = new Date();
    const sameMonth = anchorDate.getFullYear() === today.getFullYear() && anchorDate.getMonth() === today.getMonth();
    const refDate = sameMonth ? today : new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    endSunday = startOfSunday(refDate);
  } else {
    endSunday = startOfSunday(new Date());
  }
  const startSunday = new Date(endSunday);
  startSunday.setDate(startSunday.getDate() - (weeks - 1) * 7);
  const endExclusive = new Date(endSunday);
  endExclusive.setDate(endExclusive.getDate() + 7);

  const where: any = { readDate: { gte: startSunday, lt: endExclusive } };
  if (readerName) where.reader = { name: readerName };

  const rows = await prisma.reading.findMany({ where, orderBy: { readDate: "asc" } });

  const counts = Array.from({ length: weeks }, () => 0);
  const labels: string[] = [];
  const ranges: string[] = [];

  function isoWeekNumber(dIn: Date): number {
    const d = new Date(Date.UTC(dIn.getFullYear(), dIn.getMonth(), dIn.getDate()));
    const dayNum = d.getUTCDay() || 7; // Monday=1..Sunday=7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  for (let i = 0; i < weeks; i++) {
    const ws = new Date(startSunday);
    ws.setDate(ws.getDate() + i * 7);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    const wnum = isoWeekNumber(ws);
    labels.push(`${wnum}주`);
    ranges.push(`${ws.getMonth() + 1}.${ws.getDate()}~${we.getMonth() + 1}.${we.getDate()}`);
  }

  for (const r of rows) {
    const rd = new Date(r.readDate);
    const ws = startOfSunday(rd);
    const idx = Math.floor((ws.getTime() - startSunday.getTime()) / (7 * 86400000));
    if (idx >= 0 && idx < weeks) counts[idx] += 1;
  }

  // Trim leading zero-weeks so length reflects actual data (<= weeks)
  const firstIdx = counts.findIndex((v) => v > 0);
  if (firstIdx === -1) {
    return NextResponse.json({ labels: [], data: [], ranges: [], year: endSunday.getFullYear() });
  }
  const trimmedLabels = labels.slice(firstIdx);
  const trimmedCounts = counts.slice(firstIdx);
  const trimmedRanges = ranges.slice(firstIdx);

  return NextResponse.json({ labels: trimmedLabels, data: trimmedCounts, ranges: trimmedRanges, year: endSunday.getFullYear() });
}

