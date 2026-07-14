// POST /api/purge?key=ADMIN_KEY  body: { "emails": ["a@b.com", ...] }
// Deletes any lead whose stored email matches one in the list, using the same
// CN_LEADS binding the app reads/writes — the source of truth.
export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return json({ message: "Unauthorized" }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const emails = (Array.isArray(body.emails) ? body.emails : []).map((e) =>
    String(e).trim().toLowerCase()
  );
  if (emails.length === 0) return json({ message: "Provide emails: [...]" }, 400);

  const deleted = [];
  let cursor;
  do {
    const list = await env.CN_LEADS.list({ prefix: "lead:", cursor });
    for (const k of list.keys) {
      const rec = await env.CN_LEADS.get(k.name, { type: "json" }).catch(() => null);
      if (rec && emails.includes(String(rec.email || "").toLowerCase())) {
        await env.CN_LEADS.delete(k.name);
        deleted.push({ key: k.name, email: rec.email });
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return json({ ok: true, deletedCount: deleted.length, deleted });
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
