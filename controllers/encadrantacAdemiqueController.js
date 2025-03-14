const EncadrantAcademique = require('../models/EncadrantAcademique');

exports.getAll = (req, res) => {
    EncadrantAcademique.getAll((err, results) => res.json(results));
};

exports.getById = (req, res) => {
    EncadrantAcademique.getById(req.params.id, (err, results) => res.json(results[0]));
};

exports.create = (req, res) => {
    EncadrantAcademique.create(req.body, (err, result) => res.json({ id: result.insertId }));
};

exports.update = (req, res) => {
    EncadrantAcademique.update(req.params.id, req.body, (err) => res.json({ message: 'Mise à jour réussie' }));
};

exports.delete = (req, res) => {
    EncadrantAcademique.delete(req.params.id, (err) => res.json({ message: 'Suppression réussie' }));
};
