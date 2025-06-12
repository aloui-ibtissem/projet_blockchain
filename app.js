const express = require("express");
require("dotenv").config();
const path = require("path");
const db = require("./config/db");
const app = express();


// === Middleware CORS MANUEL pour une seule URL publique (ngrok)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3001", // accès local dev
    "https://projet-blockchain-blush.vercel.app", // vercel frontend
    process.env.PUBLIC_URL  //  lien ngrok 
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Traitement des pré-requêtes CORS (OPTIONS)
  if (req.method === "OPTIONS") return res.sendStatus(204);

  next();
});


// Supprimer l'avertissement ngrok dans la console
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  next();
});

app.use(express.json());

// === Routes API ===
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
app.use("/api/notifications", require("./routes/notificationsRoutes"));


// === Fichiers statiques
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/attestations", express.static(path.join(__dirname, "attestations")));
app.use("/logos", express.static(path.join(__dirname, "logos")));

//Cron job 
require("./cronJobs/rapportCron"); // Active les tâches planifiées

app.get("/api/cron/run-reminders", async (req, res) => {
  try {
    await require("./services/rapportService").remindersCheck();
    await require("./services/rapportService").remindersValidationCheck();
    await require("./services/rapportService").checkForTierIntervention();
    res.status(200).send("Rappels exécutés.");
  } catch (err) {
    res.status(500).send("Erreur CRON: " + err.message);
  }
});



// === Static React build local 
if (process.env.NODE_ENV !== "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build/index.html"));
  });
}

// === Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(` Backend lancé sur http://localhost:${PORT}`);
});
