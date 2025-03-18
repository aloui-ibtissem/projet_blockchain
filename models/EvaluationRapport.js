// models/EvaluationRapport.js
const db = require('../config/db');

class EvaluationRapport {
    static create(data, callback) {
        const query = 'INSERT INTO EvaluationRapport SET ?';
        db.query(query, data, callback);
    }

    static getByRapportId(rapportId, callback) {
        const query = 'SELECT * FROM EvaluationRapport WHERE rapportId = ?';
        db.query(query, [rapportId], callback);
    }

    static updateValidation(rapportId, encadrantId, validation, callback) {
        const query = 'UPDATE EvaluationRapport SET validation = ? WHERE rapportId = ? AND encadrantId = ?';
        db.query(query, [validation, rapportId, encadrantId], callback);
    }
}

module.exports = EvaluationRapport;
