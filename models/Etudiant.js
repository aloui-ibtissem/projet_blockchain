const db = require('../config/db');

class Etudiant {
    static getAll(callback) {
        db.query('SELECT * FROM Etudiant', callback);
    }

    static getById(id, callback) {
        db.query('SELECT * FROM Etudiant WHERE id = ?', [id], callback);
    }

    static create(data, callback) {
        db.query('INSERT INTO Etudiant SET ?', data, callback);
    }

    static update(id, data, callback) {
        db.query('UPDATE Etudiant SET ? WHERE id = ?', [data, id], callback);
    }

    static delete(id, callback) {
        db.query('DELETE FROM Etudiant WHERE id = ?', [id], callback);
    }
}

module.exports = Etudiant;
