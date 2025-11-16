const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
const multer = require("multer");
const cors = require("cors");

// Middlewares
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

let onlineUsers = new Map();

// Load chat history
let chatHistory = [];
if (fs.existsSync("chatHistory.json")) {
  try {
    const raw = fs.readFileSync("chatHistory.json", "utf8");
    chatHistory = raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading chatHistory.json — resetting to []", err);
    chatHistory = [];
  }
}

// Save history function
function saveHistory() {
  try {
    fs.writeFileSync("chatHistory.json", JSON.stringify(chatHistory, null, 2));
  } catch (err) {
    console.error("Failed to write chatHistory.json", err);
  }
}

// Ensure uploads directory exists
const uploadsDir = "public/uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File Upload System
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ filePath: "/uploads/" + req.file.filename });
});

// WebSocket events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinChat", (username) => {
    onlineUsers.set(socket.id, username);
    io.emit("updateUsers", Array.from(onlineUsers.values()));
    socket.emit("chatHistory", chatHistory);
  });

  socket.on("sendMessage", (data) => {
    data.timestamp = new Date().toLocaleTimeString();
    chatHistory.push(data);
    saveHistory();
    io.emit("message", data);
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    io.emit("updateUsers", Array.from(onlineUsers.values()));
    console.log("User disconnected:", socket.id);
  });
});

// Start server on all network interfaces so other devices can connect
const PORT = 3000;
http.listen(PORT, "0.0.0.0", () => {
  console.log(`💬 Chat App running at http://0.0.0.0:${PORT}`);
});
