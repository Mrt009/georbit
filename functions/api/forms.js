const FORM_TYPES = new Set(["newsletter", "contact", "fellowship"]);
const NOTIFY_TO = "matrika@georbit.org";

const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

async function sendNotification(env, type, email, fields) {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_EMAIL_API_TOKEN || !env.FORMS_FROM_EMAIL) return false;
  const plain = Object.entries(fields).map(([key, value]) => `${key}:\n${value}`).join("\n\n");
  const details = Object.entries(fields).map(([key, value]) =>
    `<p><strong>${escapeHtml(key)}:</strong><br>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`
  ).join("");

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          from: env.FORMS_FROM_EMAIL,
          to: NOTIFY_TO,
          subject: `Georbit ${type} form submission`,
          text: `Form: ${type}\nReply-to: ${email}\n\n${plain}`,
          html: `<h2>New Georbit ${escapeHtml(type)} submission</h2><p>Reply-to: ${escapeHtml(email)}</p>${details}`
        })
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }) {
  if (env.FORMS_ENABLED !== "true") return reply({ ok: false, error: "Form submissions are disabled." }, 503);
  if (!env.GEORBIT_DB) return reply({ ok: false, error: "Form storage is not configured." }, 503);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return reply({ ok: false, error: "Request origin is not allowed." }, 403);
  }
  if (Number(request.headers.get("content-length") || 0) > 15000) {
    return reply({ ok: false, error: "Submission is too large." }, 413);
  }

  let body;
  try { body = await request.json(); }
  catch { return reply({ ok: false, error: "Invalid submission." }, 400); }
  if (!FORM_TYPES.has(body?.type) || !body?.fields || typeof body.fields !== "object" || Array.isArray(body.fields)) {
    return reply({ ok: false, error: "Invalid submission." }, 400);
  }

  const fields = {};
  for (const [key, value] of Object.entries(body.fields)) {
    if (typeof value === "string") fields[key.slice(0, 80)] = value.trim().slice(0, 5000);
  }
  if (fields.website) return reply({ ok: true, notificationSent: false });
  const email = String(fields.email || "").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply({ ok: false, error: "Please enter a valid email address." }, 400);
  }
  fields.email = email;

  try {
    await env.GEORBIT_DB.prepare(
      "INSERT INTO form_submissions (form_type, submitter_email, fields_json) VALUES (?, ?, ?)"
    ).bind(body.type, email, JSON.stringify(fields)).run();
  } catch {
    return reply({ ok: false, error: "Could not save your submission. Please try again." }, 500);
  }

  return reply({ ok: true, notificationSent: await sendNotification(env, body.type, email, fields) }, 201);
}

export async function onRequestGet({ request, env }) {
  if (env.FORMS_ENABLED !== "true") return reply({ ok: false, error: "Form submissions are disabled." }, 503);
  if (!env.INBOX_ACCESS_TOKEN || request.headers.get("authorization") !== `Bearer ${env.INBOX_ACCESS_TOKEN}`) {
    return reply({ ok: false, error: "Unauthorized." }, 401);
  }
  if (!env.GEORBIT_DB) return reply({ ok: false, error: "Form storage is not configured." }, 503);
  const limit = Math.min(100, Math.max(1, Number(new URL(request.url).searchParams.get("limit") || 50)));
  try {
    const result = await env.GEORBIT_DB.prepare(
      "SELECT id, form_type, submitter_email, fields_json, created_at FROM form_submissions ORDER BY id DESC LIMIT ?"
    ).bind(limit).all();
    return reply({ ok: true, submissions: result.results || [] });
  } catch {
    return reply({ ok: false, error: "Could not load submissions." }, 500);
  }
}
