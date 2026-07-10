// GET /api/leads?key=SECRET — list stored leads (protected).
// Set the secret once:  npx wrangler pages secret put ADMIN_KEY --project-name codeninjas-intake
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";

  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const out = [];
  let cursor;
  do {
    const list = await env.CN_LEADS.list({ prefix: "lead:", cursor });
    for (const k of list.keys) {
      const rec = await env.CN_LEADS.get(k.name, { type: "json" }).catch(() => null);
      if (rec) out.push(rec);
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  out.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  return new Response(JSON.stringify({ count: out.length, leads: out }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
