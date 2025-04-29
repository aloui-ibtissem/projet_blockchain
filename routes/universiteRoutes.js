const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT id, nom FROM Universite");
    res.json(rows);
  } catch (err) {
    console.error("Erreur récupération universités :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;
