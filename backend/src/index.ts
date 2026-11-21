import express from "express";
import { pool } from "./db.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = 3000;
app.use(express.json());
app.use("/api/auth", authRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Привет от сервера!" });
});

app.get("/api/db-check", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({ time: result.rows[0].now });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});