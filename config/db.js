// Importation du module 'mysql' pour interagir avec la base de données MySQL
const mysql = require('mysql');

// Chargement des variables d'environnement depuis un fichier .env
require('dotenv').config(); 

// Création de la connexion à la base de données MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,     // Adresse de l'hôte de la base de données
  user: process.env.DB_USER,     // Utilisateur pour se connecter à la base de données
  password: process.env.DB_PASSWORD, // Mot de passe pour l'utilisateur de la base de données
  database: process.env.DB_NAME, // Nom de la base de données à utiliser
  port: process.env.DB_PORT      // Port de la base de données (par défaut 3306)
});

// Connexion à la base de données
db.connect((err) => {
  if (err) {
    // Si une erreur de connexion survient, on l'affiche et on arrête le processus
    console.error('Erreur de connexion à la base de données: ', err);
    process.exit(1);  // Arrêt du processus en cas d'échec de connexion
  } else {
    // Si la connexion réussit, on affiche un message de confirmation
    console.log('Connexion à la base de données réussie !');
  }
});

// Exportation de la connexion pour l'utiliser dans d'autres parties de l'application
module.exports = db;
