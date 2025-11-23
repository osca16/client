const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

const messagesFile = path.join(__dirname, "messages.json");

// Helper: read messages
function readMessages() {
  try {
    const data = fs.readFileSync(messagesFile);
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper: save messages
function saveMessages(messages) {
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// GET /messages - return all messages
app.get("/messages", (req, res) => {
  const messages = readMessages();
  res.json(messages);
});

// POST /send - send a new message
app.post("/send", (req, res) => {
  const { user, text } = req.body;
  if (!user || !text) return res.status(400).json({ error: "Invalid data" });

  const messages = readMessages();
  const newMessage = {
    user,
    text,
    timestamp: new Date().toISOString(),
  };
  messages.push(newMessage);
  saveMessages(messages);

  res.json({ status: "ok", message: newMessage });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
