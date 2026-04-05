import express from "express";
import axios from "axios";
import WebSocket from "ws";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const app = express();
app.use(express.json());

// Connect to OpenClaw internal gateway (container name: openclaw)
const ws = new WebSocket("ws://openclaw:18789");

ws.on("open", () => console.log("Connected to OpenClaw gateway"));
ws.on("error", (err) => console.error("WS error:", err));

// Telegram webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    const update = req.body;

    if (!update.message) {
      return res.sendStatus(200);
    }

    const chatId = update.message.chat.id;
    const text = update.message.text || "";

    console.log("Received Telegram message:", text);

    // Send user message to OpenClaw
    ws.send(JSON.stringify({ type: "user_message", text }));

    // Wait for OpenClaw response
    ws.once("message", async (msg) => {
      const data = JSON.parse(msg);
      const reply = data.text || "No response from agent";

      console.log("OpenClaw reply:", reply);

      // Send reply back to Telegram
      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: reply,
      });
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

app.listen(443, () => console.log("Webhook server running on port 443"));