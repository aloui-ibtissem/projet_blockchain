const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const app = express();
const path = require('path');

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

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Serveur lancé sur http://localhost:${PORT}`));

module.exports = app;
