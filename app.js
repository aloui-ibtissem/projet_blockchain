const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/universites', require('./routes/universiteRoutes'));
app.use('/entreprises', require('./routes/entrepriseRoutes'));
app.use('/etudiants', require('./routes/etudiantRoutes'));
app.use('/encadrants-academiques', require('./routes/encadrantAcademiqueRoutes'));
app.use('/encadrants-professionnels', require('./routes/encadrantProfessionnelRoutes'));

// Auth Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API d\'authentification avec blockchain' });
});

// 404 Error Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
