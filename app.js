const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

app.use('/universites', require('./routes/universiteRoutes'));
app.use('/entreprises', require('./routes/entrepriseRoutes'));
app.use('/etudiants', require('./routes/etudiantRoutes'));
app.use('/encadrants-academiques', require('./routes/encadrantAcademiqueRoutes'));
app.use('/encadrants-professionnels', require('./routes/encadrantProfessionnelRoutes'));
///
const stageRoutes = require('./routes/stageRoutes');
const sujetStageRoutes = require('./routes/sujetStageRoutes');
const rapportStageRoutes = require('./routes/rapportStageRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');

app.use('/api', stageRoutes);
app.use('/api', sujetStageRoutes);
app.use('/api', rapportStageRoutes);
app.use('/api', evaluationRoutes);

///

app.listen(process.env.PORT || 3000, () => console.log(' Serveur démarré'));
