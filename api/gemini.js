// api/gemini.js
export const config = { runtime: "edge" }; // ใช้ Edge ได้ลื่น (หรือจะเปลี่ยนเป็น nodejs20.x ก็ได้)

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return new Response(JSON.stringify({ error: "missing GEMINI_API_KEY" }), { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), { status: 400 });
  }

  const { model = "gemini-1.5-flash-latest", prompt } = body || {};
  if (!prompt) {
    return new Response(JSON.stringify({ error: "ต้องมี prompt" }), { status: 400 });
  }

  // ให้รองรับทั้งรูปแบบ "gemini-1.5-xxx" และ "models/gemini-1.5-xxx"
  const modelPath = model.startsWith("models/") ? model : `models/${model}`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }]}]
        })
      }
    );

    const data = await resp.json();
    if (!resp.ok) {
      // ให้ client ได้ข้อความ error จาก API ชัดเจน
      return new Response(JSON.stringify({ error: data.error?.message || resp.statusText }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // frontend ของคุณคาดหวังฟอร์แมตที่มี candidates อยู่แล้ว -> ส่งคืนทั้งก้อน
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500 });
  }
}
