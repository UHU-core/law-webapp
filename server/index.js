require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 4400;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

console.log("Loaded GEMINI_API_KEY:", JSON.stringify(process.env.GEMINI_API_KEY));

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

app.post("/api/gemini", async (req, res) => {
  try {
    if (!GEMINI_KEY) {
      return res.status(500).json({ error: "ไม่มี GEMINI_API_KEY (ตั้งใน .env ก่อน)" });
    }

    const { model = "gemini-1.5-flash-latest", prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "ต้องมี prompt" });

    // ✅ เรียก API ผ่าน SDK
    const modelInstance = genAI.getGenerativeModel({ model });
    const result = await modelInstance.generateContent(prompt);

    // SDK คืนค่าเป็น object มี candidates
    res.json(result.response);
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// เสิร์ฟ frontend
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
app.get("*", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
