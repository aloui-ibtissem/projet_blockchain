const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/db');

// Vérifier si la ligne existe déjà dans la base de données 
const checkIfExists = (tableName, row) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT COUNT(*) AS count FROM ${tableName} WHERE id = ?`;
        db.query(query, [row.id], (err, results) => {
            if (err) {
                console.error(`Erreur lors de la vérification de l'existence de la ligne dans ${tableName}:`, err);
                return reject(err);
            }
            resolve(results[0].count > 0);
        });
    });
};

// Insérer ou mettre à jour une ligne dans la base de données
const insertOrUpdateRow = (tableName, row) => {
    return new Promise(async (resolve, reject) => {
        try {
            const exists = await checkIfExists(tableName, row);
            if (exists) {
                // Mettre à jour la ligne si elle existe déjà
                const query = `
                    UPDATE ${tableName} SET 
                        prenom = ?, 
                        nom = ?, 
                        email = ?, 
                        universiteId = ?
                    WHERE id = ?`;
                db.query(query, [row.prenom, row.nom, row.email, row.universiteId, row.id], (err) => {
                    if (err) {
                        console.error(`Erreur lors de la mise à jour dans ${tableName}:`, err);
                        return reject(err);
                    }
                    resolve();
                });
            } else {
                // Insérer la ligne si elle n'existe pas
                const query = `INSERT INTO ${tableName} SET ?`;
                db.query(query, row, (err) => {
                    if (err) {
                        console.error(`Erreur d'insertion dans ${tableName}:`, err);
                        return reject(err);
                    }
                    resolve();
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};

// Importer les données CSV
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
