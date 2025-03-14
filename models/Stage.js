const db = require('../config/db');

class Stage {
    static getAll(callback) {
        db.query('SELECT * FROM Stage', callback);
    }

    static getById(id, callback) {
        db.query('SELECT * FROM Stage WHERE id = ?', [id], callback);
    }

    static create(data, callback) {
        db.query('INSERT INTO Stage SET ?', data, callback);
    }

    static update(id, data, callback) {
        db.query('UPDATE Stage SET ? WHERE id = ?', [data, id], callback);
    }

    static delete(id, callback) {
        db.query('DELETE FROM Stage WHERE id = ?', [id], callback);
    }

    static updateStatus(id, etat, callback) {
        db.query('UPDATE Stage SET etat = ? WHERE id = ?', [etat, id], callback);
    }
}

module.exports = Stage;
