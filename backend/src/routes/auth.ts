import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    res.status(400).json({ error: "Заполните email, пароль и имя" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Пароль должен быть не короче 8 символов" });
    return;
  }

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: "Этот email уже зарегистрирован" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'patient') RETURNING id, email, full_name, role",
    [email, passwordHash, fullName]
  );

  res.status(201).json(result.rows[0]);
});
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Введите email и пароль" });
    return;
  }

  const result = await pool.query(
    "SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];

  const passwordOk = user && (await bcrypt.compare(password, user.password_hash));
  if (!passwordOk) {
    res.status(401).json({ error: "Неверный email или пароль" });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
  });
});