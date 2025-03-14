const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/db');

// Vérifier si la table contient déjà des données
const isTableEmpty = (tableName) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT COUNT(*) AS count FROM ${tableName}`;
        db.query(query, (err, results) => {
            if (err) {
                console.error(`Erreur lors de la vérification de la table ${tableName}:`, err);
                return reject(err);
            }
            resolve(results[0].count === 0);
        });
    });
};

// Insérer une ligne dans la base de données
const insertRow = (tableName, row) => {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO ${tableName} SET ?`;
        db.query(query, row, (err) => {
            if (err) {
                console.error(`Erreur d'insertion dans ${tableName}:`, err);
                return reject(err);
            }
            resolve();
        });
    });
};

// Importer les données CSV uniquement si la table est vide
const importCSVIfEmpty = async (filePath, tableName) => {
    try {
        const empty = await isTableEmpty(tableName);
        if (!empty) {
            console.log(`Importation ignorée : la table ${tableName} contient déjà des données.`);
            return;
        }

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
                    console.error(`Erreur lors de l'importation des données dans ${tableName}:`, err);
                }
            })
            .on('error', (err) => {
                console.error(`Erreur lors de la lecture du fichier CSV (${filePath}):`, err);
            });
    } catch (err) {
        console.error(`Erreur lors de la vérification de la table ${tableName}:`, err);
    }
};

// Exécution des importations uniquement si les tables sont vides
importCSVIfEmpty(__dirname + '/universites.csv', 'Universite');
importCSVIfEmpty(__dirname + '/entreprises.csv', 'Entreprise');
importCSVIfEmpty(__dirname + '/etudiants.csv', 'Etudiant');
importCSVIfEmpty(__dirname + '/encadrants_academiques.csv', 'EncadrantAcademique');
importCSVIfEmpty(__dirname + '/encadrants_professionnels.csv', 'EncadrantProfessionnel');
