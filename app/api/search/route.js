import { runAiSearch } from "../../../src/features/ai/service.js";
import { isGeminiConfigured } from "../../../src/shared/clients/gemini.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const query = String(body?.query || "").trim();
    if (!query) {
      return Response.json(
        { data: null, error: "query is required" },
        { status: 400 },
      );
    }

    const result = await runAiSearch(query);
    if (result.error) {
      return Response.json(
        { data: null, error: result.error },
        { status: 500 },
      );
    }

    return Response.json({
      data: {
        events: result.events,
        filters_applied: result.filters_applied,
        ai_summary: result.ai_summary,
        parser: result.parser,
        gemini_enabled: isGeminiConfigured(),
      },
      error: null,
    });
  } catch (err) {
    console.error("AI search error:", err);
    return Response.json(
      { data: null, error: "Search failed" },
      { status: 500 },
    );
  }
}
