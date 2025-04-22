const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const app = express();

// Import des routes
const authRoutes = require("./routes/authRoutes");

app.use(cors());
app.use(express.json());

// === Déclaration des routes
app.use("/api/auth", authRoutes); //pour l’authentification

// Autres routes selon ton projet
app.use('/universites', require('./routes/universiteRoutes'));
app.use('/entreprises', require('./routes/entrepriseRoutes'));
app.use('/etudiants', require('./routes/etudiantRoutes'));
app.use('/encadrants-academiques', require('./routes/encadrantAcademiqueRoutes'));
app.use('/encadrants-professionnels', require('./routes/encadrantProfessionnelRoutes'));

// === Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Serveur lancé sur http://localhost:${PORT}`));

module.exports = app;
