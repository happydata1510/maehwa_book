import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// DELETE /api/readers/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "Invalid reader ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from('readers')
      .delete()
      .eq('id', Number(id));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("/api/readers/[id] DELETE error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
