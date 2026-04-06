require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/chat", async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  const { messages } = req.body || {};

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GROQ_API_KEY in .env.",
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "Request body must include a non-empty messages array.",
    });
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        `Groq API request failed with status ${response.status}.`;

      return res.status(response.status).json({
        error: errorMessage,
      });
    }

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return res.status(502).json({
        error: "Groq API returned an empty response.",
      });
    }

    return res.json({ content });
  } catch (error) {
    console.error("Backend chat error:", error);
    return res.status(500).json({
      error: "Unable to reach the Groq API right now.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
