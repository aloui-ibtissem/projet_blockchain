const db = require('../config/db');

class EncadrantProfessionnel {
    static getAll(callback) {
        db.query('SELECT * FROM EncadrantProfessionnel', callback);
    }

    static getById(id, callback) {
        db.query('SELECT * FROM EncadrantProfessionnel WHERE id = ?', [id], callback);
    }

    static create(data, callback) {
        db.query('INSERT INTO EncadrantProfessionnel SET ?', data, callback);
    }

    static update(id, data, callback) {
        db.query('UPDATE EncadrantProfessionnel SET ? WHERE id = ?', [data, id], callback);
    }

    static delete(id, callback) {
        db.query('DELETE FROM EncadrantProfessionnel WHERE id = ?', [id], callback);
    }
}

module.exports = EncadrantProfessionnel;
