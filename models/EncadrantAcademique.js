const db = require('../config/db');

class EncadrantAcademique{
    static getAll(callback) {
        db.query('SELECT * FROM EncadrantAcademique', callback);
    }

    static getById(id, callback) {
        db.query('SELECT * FROM EncadrantAcademique WHERE id = ?', [id], callback);
    }

    static create(data, callback) {
        db.query('INSERT INTO EncadrantAcademique SET ?', data, callback);
    }

    static update(id, data, callback) {
        db.query('UPDATE EncadrantAcademique SET ? WHERE id = ?', [data, id], callback);
    }

   
   

}
 EncadrantAcademique.delete = (id, callback) => {
    db.query('DELETE FROM encadrant_academique WHERE id = ?', [id], callback);
};


module.exports = EncadrantAcademique;
