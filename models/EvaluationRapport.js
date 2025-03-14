const db = require('../config/db');

class EvaluationRapport {
    static create(data, callback) {
        db.query('INSERT INTO EvaluationRapport SET ?', data, callback);
    }
}

module.exports = EvaluationRapport;
