import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { setSocketServer } from "./socket/socketStore.js";
import { pool } from "./db/pool.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.clientOrigin
  }
});

io.on("connection", (socket) => {
  socket.emit("socket:connected", { connected: true });
});

setSocketServer(io);

server.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
