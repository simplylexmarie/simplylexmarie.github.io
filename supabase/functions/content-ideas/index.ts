// Supabase Edge Function: content-ideas
// Generates tailored content suggestions for Simply Lex Marie using the Claude API,
// with live web search for current trends. The Anthropic API key stays server-side
// (set as the ANTHROPIC_API_KEY secret) so it is never exposed in the public site.
//
// Only a logged-in admin user can call this (we verify the Supabase user token),
// so random visitors cannot run up the Anthropic bill.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// To save money, swap this to "claude-sonnet-4-6" (cheaper) or "claude-haiku-4-5" (cheapest).
const MODEL = "claude-opus-4-8";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // 1) Verify the caller is a logged-in admin (not just anyone with the public key).
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: SUPABASE_ANON_KEY },
  });
  if (!userRes.ok) return json({ error: "Not signed in." }, 401);
  const user = await userRes.json();
  if (!user || user.role !== "authenticated") {
    return json({ error: "Admin sign-in required." }, 401);
  }

  // 2) Read the request: her recent notes + an optional theme.
  let notes: string[] = [];
  let theme = "";
  try {
    const body = await req.json();
    if (Array.isArray(body.notes)) notes = body.notes.slice(0, 25).map(String);
    if (typeof body.theme === "string") theme = body.theme.slice(0, 200);
  } catch (_) { /* empty body is fine */ }

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) return json({ error: "Missing ANTHROPIC_API_KEY secret." }, 500);

  const system = [
    "You are a content strategist for Alexia, who runs the creator brand \"Simply Lex Marie.\"",
    "Her niche: honest fuller-bust fashion. Try-ons, swimsuit reviews, dresses, and recreating outfits people pin on Pinterest, all on a fuller bust. Her audience is the \"Big Bitty Besties.\"",
    "She posts mostly on TikTok (@simply.lexmarie) and Instagram, and shops her finds via LTK and an Amazon storefront.",
    "Her voice is warm, real, and encouraging. NEVER use em dashes or en dashes in anything you write for her. Use commas, periods, or rewordings instead.",
    "Use the web search tool to find what is genuinely trending right now in fashion, fuller-bust styling, and short-form video, then translate those trends into specific videos SHE could film in her style.",
    "Each idea must be concrete and filmable: a clear hook or concept, not a vague topic.",
    "Return ONLY a JSON array of exactly 5 objects, each: {\"title\": short label (max 6 words), \"idea\": one or two sentences describing the video, \"trend\": a few words on the trend or angle it taps into}. No prose before or after the JSON.",
  ].join("\n");

  let userMsg = "Give me 5 fresh content ideas I could film this week.";
  if (theme) userMsg += ` Lean into this theme or vibe: ${theme}.`;
  if (notes.length) {
    userMsg += " Here are ideas already in my notes, so suggest NEW ones that do not repeat these:\n- " + notes.join("\n- ");
  }

  // 3) Call Claude with the server-side web_search tool. Handle pause_turn loops.
  const messages: any[] = [{ role: "user", content: userMsg }];
  let data: any = null;
  for (let i = 0; i < 4; i++) {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
        messages,
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text();
      return json({ error: "AI request failed.", detail }, 502);
    }
    data = await resp.json();
    if (data.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: data.content });
      continue; // server resumes the web search loop
    }
    break;
  }

  // 4) Pull the JSON array out of the final text.
  const text = (data?.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
  let ideas: any[] = [];
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    try { ideas = JSON.parse(text.slice(start, end + 1)); } catch (_) { /* fall through */ }
  }
  if (!ideas.length) return json({ error: "Could not read ideas.", raw: text }, 502);

  return json({ ideas });
});
