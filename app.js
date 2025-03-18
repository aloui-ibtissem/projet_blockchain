const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// Routes spécifiques aux différentes entités
app.use('/universites', require('./routes/universiteRoutes'));
app.use('/entreprises', require('./routes/entrepriseRoutes'));
app.use('/etudiants', require('./routes/etudiantRoutes'));
app.use('/encadrants-academiques', require('./routes/encadrantAcademiqueRoutes'));
app.use('/encadrants-professionnels', require('./routes/encadrantProfessionnelRoutes'));

// Routes pour le stage, sujet de stage, rapport, et évaluation
app.use('/api/stages', require('./routes/stageRoutes'));
app.use('/api/sujets-stage', require('./routes/sujetStageRoutes'));
app.use('/api/rapports-stage', require('./routes/rapportStageRoutes'));
app.use('/api/evaluations', require('./routes/evaluationRoutes'));

// Démarrage du serveur
app.listen(process.env.PORT || 3000, () => console.log('Serveur démarré'));
