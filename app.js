const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const app = express();
const path = require('path');

//  Liste des origines autorisées
const allowedOrigins = [
  "http://localhost:3001",
  "https://6231-102-173-126-171.ngrok-free.app",
  "https://projet-blockchain-blush.vercel.app"
];

//  Middleware CORS dynamique
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log("CORS origin:", origin);

  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204); // No content
    }
    return next();
  } else {
    console.warn("CORS refusé pour:", origin);
    return res.status(403).json({ error: "CORS non autorisé pour cette origine." });
  }
});

//  Désactiver l’avertissement Ngrok
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

app.use(express.json());

//  Routes API
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/stage", require("./routes/stageRoutes"));
app.use("/api/rapport", require("./routes/rapportStageRoutes"));
app.use("/api/attestation", require("./routes/attestationRoutes"));

app.use("/universites", require("./routes/universiteRoutes"));
app.use("/entreprises", require("./routes/entrepriseRoutes"));
app.use("/etudiants", require("./routes/etudiantRoutes"));
app.use("/encadrants-academiques", require("./routes/encadrantAcademiqueRoutes"));
app.use("/encadrants-professionnels", require("./routes/encadrantProfessionnelRoutes"));
app.use("/verify", require("./routes/verify"));

//  Fichiers statiques
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/attestations", express.static(path.join(__dirname, "attestations")));

//  Serveur React (Vercel/localhost)
app.use(express.static(path.join(__dirname, "client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build/index.html"));
});

//  Démarrage
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(` Serveur lancé : http://localhost:${PORT}`);
});
