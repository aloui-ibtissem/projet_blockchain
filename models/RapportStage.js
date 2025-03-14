const db = require('../config/db');

class RapportStage {
    static create(data, callback) {
        db.query('INSERT INTO RapportStage SET ?', data, callback);
    }

    static getByStageId(stageId, callback) {
        db.query('SELECT * FROM RapportStage WHERE stageId = ?', [stageId], callback);
    }
}

module.exports = RapportStage;
