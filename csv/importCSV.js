const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/db');

const importCSV = (filePath, tableName) => {
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            db.query(`INSERT INTO ${tableName} SET ?`, row, (err) => {
                if (err) console.error(`❌ Erreur d'insertion dans ${tableName}:`, err);
            });
        })
        .on('end', () => {
            console.log(`✅ Importation des données dans ${tableName} terminée.`);
        });
};

// Exécuter l'importation
importCSV(__dirname + '/universites.csv', 'Universite');
importCSV(__dirname + '/entreprises.csv', 'Entreprise');
importCSV(__dirname + '/etudiants.csv', 'Etudiant');
importCSV(__dirname + '/encadrants_academiques.csv', 'EncadrantAcademique');
importCSV(__dirname + '/encadrants_professionnels.csv', 'EncadrantProfessionnel');
