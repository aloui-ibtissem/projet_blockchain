const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const app = express();
const path = require('path');


//
app.use(cors({
  origin: ['http://localhost:3001', 'https://ffab-102-107-10-247.ngrok-free.app'], // ton frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
//
app.options('*', cors()); // pour gérer toutes les requêtes OPTIONS
//
// éviter /désactiver la page de warning ngrok
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Import des routes
const authRoutes = require("./routes/authRoutes");
const stageRoutes = require("./routes/stageRoutes");
const rapportRoutes = require("./routes/rapportStageRoutes"); 
const universiteRoutes = require("./routes/universiteRoutes");
const entrepriseRoutes = require("./routes/entrepriseRoutes");
const etudiantRoutes = require("./routes/etudiantRoutes");
const encadrantAcademiqueRoutes = require("./routes/encadrantAcademiqueRoutes");
const encadrantProfessionnelRoutes = require("./routes/encadrantProfessionnelRoutes");
const attestationRoutes = require("./routes/attestationRoutes");

app.use(cors());
app.use(express.json());

// Déclaration des routes
app.use("/api/auth", authRoutes); 
app.use("/api/stage", stageRoutes);
app.use("/api/rapport", rapportRoutes);
app.use("/api/attestation", attestationRoutes);

app.use('/universites', universiteRoutes);
app.use('/entreprises', entrepriseRoutes);
app.use('/etudiants', etudiantRoutes);
app.use('/encadrants-academiques', encadrantAcademiqueRoutes);
app.use('/encadrants-professionnels', encadrantProfessionnelRoutes);

// Rendre le dossier 'uploads/' accessible via l'URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dossier pour les attestations générées
app.use('/attestations', express.static(path.join(__dirname, 'attestations')));
//
const verifyRoute = require("./routes/verify");
app.use("/verify", verifyRoute); 

// === Servir le frontend React build (client/build)
app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build/index.html"));
});



// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT,"0.0.0.0",  () => {
  console.log(` Serveur accessible via ngrok ou local : http://localhost:${PORT}`);
});

module.exports = app;

