const db = require('../config/db');

class Entreprise {
    static getAll(callback) {
        db.query('SELECT * FROM Entreprise', callback);
    }

    static getById(id, callback) {
        db.query('SELECT * FROM Entreprise WHERE id = ?', [id], callback);
    }

    static create(data, callback) {
        db.query('INSERT INTO Entreprise SET ?', data, callback);
    }

    static update(id, data, callback) {
        db.query('UPDATE Entreprise SET ? WHERE id = ?', [data, id], callback);
    }

    static delete(id, callback) {
        db.query('DELETE FROM Entreprise WHERE id = ?', [id], callback);
    }
}

module.exports = Entreprise;
