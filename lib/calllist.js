// Shared helpers for the /max and /siva call sheets.
// Reads leads from the CN_LEADS KV binding, splits the list in half
// deterministically, and renders a simple mobile-friendly call sheet.

// Fetch every stored lead record.
export async function getLeads(env) {
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
  return out;
}

// Sort alphabetically (by first name, then last) and split into two
// contiguous halves. "max" gets the first half, "siva" the second.
// Deterministic: no overlaps and no gaps, and it re-balances on its own
// as new leads come in.
export function splitLeads(leads) {
  const sorted = [...leads].sort((a, b) => {
    const an = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
    const bn = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
    return an.localeCompare(bn);
  });
  const mid = Math.ceil(sorted.length / 2);
  return { max: sorted.slice(0, mid), siva: sorted.slice(mid) };
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function fmtPhone(p) {
  const d = String(p || "").replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p || "";
}

function telHref(p) {
  const d = String(p || "").replace(/\D/g, "");
  return d.length === 10 ? `+1${d}` : d;
}

// Render the HTML call sheet for one person's half.
export function renderCallSheet(owner, leads) {
  const rows = leads
    .map((r, i) => {
      const name = escapeHtml(`${r.firstName || ""} ${r.lastName || ""}`.trim() || "—");
      const phone = fmtPhone(r.phone);
      const tel = telHref(r.phone);
      const email = escapeHtml(r.email || "");
      return `<tr>
        <td class="num">${i + 1}</td>
        <td class="name">${name}</td>
        <td class="phone">${phone ? `<a href="tel:${tel}">${escapeHtml(phone)}</a>` : "—"}</td>
        <td class="email">${email ? `<a href="mailto:${email}">${email}</a>` : "—"}</td>
      </tr>`;
    })
    .join("\n");

  const title = `Call list — ${owner}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #f7f7f8; color: #18181b; padding: 16px; }
  h1 { font-size: 20px; margin: 4px 0 2px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 14px; }
  .wrap { max-width: 760px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  th, td { text-align: left; padding: 11px 12px; border-bottom: 1px solid #ececf0; font-size: 15px; }
  th { background: #fafafa; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; }
  tr:last-child td { border-bottom: none; }
  td.num { color: #9ca3af; width: 34px; }
  td.name { font-weight: 600; }
  td.phone a { font-weight: 600; text-decoration: none; }
  a { color: #2563eb; }
  .email { word-break: break-all; }
  @media (max-width: 560px) { .email, th.email-h { display: none; } td, th { padding: 10px 8px; } }
  @media (prefers-color-scheme: dark) {
    body { background: #0f0f11; color: #f4f4f5; }
    table { background: #1a1a1e; box-shadow: none; }
    th { background: #202024; color: #9ca3af; }
    th, td { border-bottom-color: #2a2a30; }
    a { color: #7aa2ff; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${leads.length} lead${leads.length === 1 ? "" : "s"} to call · Code Ninjas Woodbridge</div>
    <table>
      <thead>
        <tr><th class="num">#</th><th>Name</th><th>Phone</th><th class="email-h">Email</th></tr>
      </thead>
      <tbody>
${rows || `<tr><td colspan="4" style="color:#6b7280">No leads.</td></tr>`}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

// Build the full Response for a given owner ("max" | "siva").
export async function callSheetResponse(env, owner) {
  const leads = await getLeads(env);
  const halves = splitLeads(leads);
  const mine = owner === "siva" ? halves.siva : halves.max;
  const label = owner === "siva" ? "Siva" : "Max";
  return new Response(renderCallSheet(label, mine), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
