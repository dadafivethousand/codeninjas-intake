// POST /api/lead — validate + store a lead in the CN_LEADS KV namespace.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json().catch(() => ({}));

    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const phone = String(data.phone || "").replace(/\D/g, "");
    const honeypot = String(data.company || "").trim();

    // silently accept bot submissions (honeypot filled) without storing
    if (honeypot) return json({ ok: true });

    if (!firstName || !lastName) return json({ message: "Please enter your name." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ message: "Please enter a valid email." }, 400);
    if (phone.length !== 10) return json({ message: "Please enter a valid 10-digit phone number." }, 400);

    const createdAt = new Date().toISOString();
    const stamp = createdAt.replace(/[-:.TZ]/g, "");
    const key = `lead:${email}:${stamp}`;

    const record = {
      firstName,
      lastName,
      email,
      phone,
      createdAt,
      source: "codeninjas-intake",
      ip: request.headers.get("cf-connecting-ip") || "",
    };

    await env.CN_LEADS.put(key, JSON.stringify(record));

    return json({ ok: true });
  } catch (err) {
    return json({ message: "Server error — please try again." }, 500);
  }
}
