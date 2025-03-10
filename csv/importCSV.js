const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/db');

const insertRow = (tableName, row) => {
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO ${tableName} SET ?`, row, (err) => {
            if (err) {
                console.error(`Erreur d'insertion dans ${tableName}:`, err);
                return reject(err);
            }
            resolve();
        });
    });
};

const importCSV = async (filePath, tableName) => {
    const rows = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            rows.push(row);
        })
        .on('end', async () => {
            try {
                for (const row of rows) {
                    await insertRow(tableName, row);
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


importCSV(__dirname + '/universites.csv', 'Universite');
importCSV(__dirname + '/entreprises.csv', 'Entreprise');
importCSV(__dirname + '/etudiants.csv', 'Etudiant');
importCSV(__dirname + '/encadrants_academiques.csv', 'EncadrantAcademique');
importCSV(__dirname + '/encadrants_professionnels.csv', 'EncadrantProfessionnel');
