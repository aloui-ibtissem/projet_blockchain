const db = require('../config/db');

class SujetStage {
    static create(data, callback) {
        db.query('INSERT INTO SujetStage SET ?', data, callback);
    }

    static getByStageId(stageId, callback) {
        db.query('SELECT * FROM SujetStage WHERE stageId = ?', [stageId], callback);
    }
}

module.exports = SujetStage;
