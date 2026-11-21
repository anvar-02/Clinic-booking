import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const doctorsRouter = Router();

doctorsRouter.get("/", requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT d.id, u.full_name AS "fullName", d.speciality
     FROM doctors d
     JOIN users u ON u.id = d.user_id
     ORDER BY u.full_name`
  );
  res.json(result.rows);
});