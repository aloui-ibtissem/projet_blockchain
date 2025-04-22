const db = require('../config/db');

class Universite {
    static getAll(callback) {
        db.query('SELECT * FROM Universite', callback);
    }

    static getById(id, callback) {
        db.query('SELECT * FROM Universite WHERE id = ?', [id], callback);
    }

    static create(data, callback) {
        db.query('INSERT INTO Universite SET ?', data, callback);
    }

    static update(id, data, callback) {
        db.query('UPDATE Universite SET ? WHERE id = ?', [data, id], callback);
    }

    static delete(id, callback) {
        db.query('DELETE FROM Universite WHERE id = ?', [id], callback);
    }
}

module.exports = Universite;
