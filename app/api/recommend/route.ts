import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// Very simple rule-based recommender using existing DB + popularity
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const age = Number(searchParams.get("age") ?? "0") || undefined;
  const limit = Number(searchParams.get("limit") ?? "10") || 10;

  const whereBook: any = {};
  if (age) {
    whereBook.AND = [
      { OR: [{ ageMin: null }, { ageMin: { lte: age } }] },
      { OR: [{ ageMax: null }, { ageMax: { gte: age } }] },
    ];
  }

  // Top popular among filtered books
  // TODO: Supabase 쿼리로 수정 필요
  const popular: any[] = []; // 임시
  const books: any[] = []; // 임시

  return NextResponse.json(books);
}

