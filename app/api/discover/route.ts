import { NextRequest, NextResponse } from "next/server";
import { suggestProjects } from "@/lib/ai-search";

export async function GET(request: NextRequest) {
  const prompt = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (prompt.length < 3) {
    return NextResponse.json({ suggestions: [], error: "Describe what you want to make or find." }, { status: 400 });
  }
  if (prompt.length > 300) {
    return NextResponse.json({ suggestions: [], error: "Please keep your description under 300 characters." }, { status: 400 });
  }

  try {
    return NextResponse.json({ suggestions: await suggestProjects(prompt) });
  } catch (error) {
    console.error("Discovery search failed:", error);
    return NextResponse.json({ error: "Discovery search is temporarily unavailable." }, { status: 500 });
  }
}
