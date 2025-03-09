const mysql = require('mysql');
require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT // La variable d'environnement DB_PORT doit être définie
});

// Connexion à la base de données
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données: ', err);
    process.exit(1); // Quitte le processus si la connexion échoue
  } else {
    console.log('Connexion à la base de données réussie !');
  }
});

module.exports = db;
