import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const appointmentsRouter = Router();

appointmentsRouter.post("/", requireAuth, requireRole("patient"), async (req, res) => {
  const { doctorId, startTime } = req.body;

  if (!doctorId || !startTime) {
    res.status(400).json({ error: "Укажите врача и время" });
    return;
  }

  const date = new Date(startTime);
  if (isNaN(date.getTime())) {
    res.status(400).json({ error: "Неверный формат времени" });
    return;
  }
  if (date <= new Date()) {
    res.status(400).json({ error: "Нельзя записаться на прошедшее время" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO appointments (doctor_id, patient_id, start_time)
       VALUES ($1, $2, $3)
       RETURNING id, doctor_id AS "doctorId", start_time AS "startTime"`,
      [doctorId, res.locals.user.userId, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Это время уже занято" });
      return;
    }
    if (err.code === "23503") {
      res.status(404).json({ error: "Врач не найден" });
      return;
    }
    throw err;
  }
});

appointmentsRouter.get("/my", requireAuth, requireRole("patient"), async (req, res) => {
  const result = await pool.query(
    `SELECT a.id, a.start_time AS "startTime", u.full_name AS "doctorName", d.speciality
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users u ON u.id = d.user_id
     WHERE a.patient_id = $1
     ORDER BY a.start_time`,
    [res.locals.user.userId]
  );
  res.json(result.rows);
});