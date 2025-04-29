const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const app = express();

// Import des routes
const authRoutes = require("./routes/authRoutes");
const stageRoutes = require("./routes/stageRoutes");
const rapportRoutes = require("./routes/rapportRoutes"); 
const universiteRoutes = require("./routes/universiteRoutes");
const entrepriseRoutes = require("./routes/entrepriseRoutes");
const etudiantRoutes = require("./routes/etudiantRoutes");
const encadrantAcademiqueRoutes = require("./routes/encadrantAcademiqueRoutes");
const encadrantProfessionnelRoutes = require("./routes/encadrantProfessionnelRoutes");

app.use(cors());
app.use(express.json());

// Déclaration des routes
app.use("/api/auth", authRoutes); // Authentification
app.use("/api/stage", stageRoutes); // Gestion des stages
app.use("/api/rapport", rapportRoutes); // Gestion des rapports (Tiers Débloqueurs)

// 
app.use('/universites', universiteRoutes);
app.use('/entreprises', entrepriseRoutes);
app.use('/etudiants', etudiantRoutes);
app.use('/encadrants-academiques', encadrantAcademiqueRoutes);
app.use('/encadrants-professionnels', encadrantProfessionnelRoutes);

//  Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));

module.exports = app;
