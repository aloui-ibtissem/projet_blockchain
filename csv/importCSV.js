const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/db');

//  insérer ou mettre à jour une ligne dans la base de données
const insertOrUpdateRow = (tableName, row) => {
    return new Promise((resolve, reject) => {
        //  `ON DUPLICATE KEY UPDATE` pour gérer l'insertion ou la mise à jour
        db.query(`
            INSERT INTO ${tableName} SET ?
            ON DUPLICATE KEY UPDATE
                prenom = VALUES(prenom), 
                nom = VALUES(nom),
                email = VALUES(email),
                entrepriseId = VALUES(entrepriseId)`, 
            row, (err) => {
                if (err) {
                    console.error(`Erreur d'insertion ou de mise à jour dans ${tableName}:`, err);
                    return reject(err);
                }
                resolve();
            });
    });
};

//  importer les données CSV
const importCSV = async (filePath, tableName) => {
    const rows = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            rows.push(row);
        })
        .on('end', async () => {
            try {
                // Insère ou met à jour les lignes dans la base de données
                for (const row of rows) {
                    await insertOrUpdateRow(tableName, row);
                }
                console.log(`Importation des données dans ${tableName} terminée.`);
            } catch (err) {
                console.error('Erreur lors de l\'importation des données:', err);
            }
        })
        .on('error', (err) => {
            console.error('Erreur lors de la lecture du fichier CSV:', err);
        });
};

// Exécution des importations pour chaque fichier CSV
importCSV(__dirname + '/universites.csv', 'Universite');
importCSV(__dirname + '/entreprises.csv', 'Entreprise');
importCSV(__dirname + '/etudiants.csv', 'Etudiant');
importCSV(__dirname + '/encadrants_academiques.csv', 'EncadrantAcademique');
importCSV(__dirname + '/encadrants_professionnels.csv', 'EncadrantProfessionnel');
