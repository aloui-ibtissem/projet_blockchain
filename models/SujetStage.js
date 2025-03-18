
const db = require('../config/db');

class SujetStage {
    // Créer un nouveau sujet de stage
    static create(data, callback) {
        db.query('INSERT INTO SujetStage SET ?', data, callback);
    }

    // Récupérer un sujet de stage par ID
    static getById(id, callback) {
        db.query('SELECT * FROM SujetStage WHERE id = ?', [id], callback);
    }

    // Récupérer tous les sujets de stage d'un étudiant
    static getByEtudiantId(etudiantId, callback) {
        db.query('SELECT * FROM SujetStage WHERE etudiantId = ?', [etudiantId], callback);
    }
}

module.exports = SujetStage;
