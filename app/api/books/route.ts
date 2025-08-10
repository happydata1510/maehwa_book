import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/books?query=...&age=5
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const age = searchParams.get("age");

  try {
    let supabaseQuery = supabase.from('books').select('*');

    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%`);
    }

    if (age) {
      const n = Number(age);
      if (!Number.isNaN(n)) {
        supabaseQuery = supabaseQuery
          .or(`age_min.is.null,age_min.lte.${n}`)
          .or(`age_max.is.null,age_max.gte.${n}`);
      }
    }

    const { data: books, error } = await supabaseQuery
      .order('title', { ascending: true })
      .limit(20);

    if (error) throw error;

    return NextResponse.json(books || []);
  } catch (e) {
    console.error("/api/books GET error", e);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/books
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, author, ageMin, ageMax } = body ?? {};
  if (!title || !author) return NextResponse.json({ error: "title, author required" }, { status: 400 });

  try {
    // 먼저 기존 책이 있는지 확인
    const { data: existingBook } = await supabase
      .from('books')
      .select('*')
      .eq('title', title)
      .eq('author', author)
      .single();

    if (existingBook) {
      // 기존 책 업데이트
      const { data: updatedBook, error } = await supabase
        .from('books')
        .update({ 
          age_min: ageMin ?? null, 
          age_max: ageMax ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingBook.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(updatedBook, { status: 200 });
    } else {
      // 새 책 생성
      const { data: newBook, error } = await supabase
        .from('books')
        .insert({
          title,
          author,
          age_min: ageMin ?? null,
          age_max: ageMax ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(newBook, { status: 201 });
    }
  } catch (e) {
    console.error("/api/books POST error", e);
    return NextResponse.json({ error: "Failed to create/update book" }, { status: 500 });
  }
}