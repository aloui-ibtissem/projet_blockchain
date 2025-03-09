const Etudiant = require('../models/Etudiant');

exports.getAll = (req, res) => {
    Etudiant.getAll((err, results) => res.json(results));
};

exports.getById = (req, res) => {
    Etudiant.getById(req.params.id, (err, results) => res.json(results[0]));
};

exports.create = (req, res) => {
    Etudiant.create(req.body, (err, result) => res.json({ id: result.insertId }));
};

exports.update = (req, res) => {
    Etudiant.update(req.params.id, req.body, (err) => res.json({ message: 'Mise à jour réussie' }));
};

exports.delete = (req, res) => {
    Etudiant.delete(req.params.id, (err) => res.json({ message: 'Suppression réussie' }));
};
