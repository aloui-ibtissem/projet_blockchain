// models/RapportStage.js
const db = require('../config/db');

class RapportStage {
    static getByStageId(stageId, callback) {
        const query = 'SELECT * FROM RapportStage WHERE stageId = ?';
        db.query(query, [stageId], callback);
    }

    static create(data, callback) {
        const query = 'INSERT INTO RapportStage SET ?';
        db.query(query, data, callback);
    }

    static updateStatus(stageId, statutAcademique, statutProfessionnel, callback) {
        const query = 'UPDATE RapportStage SET statutAcademique = ?, statutProfessionnel = ? WHERE stageId = ?';
        db.query(query, [statutAcademique, statutProfessionnel, stageId], callback);
    }

    static delete(stageId, callback) {
        const query = 'DELETE FROM RapportStage WHERE stageId = ?';
        db.query(query, [stageId], callback);
    }
}

module.exports = RapportStage;
