const Entreprise = require('../models/Entreprise');

exports.getAll = (req, res) => {
    Entreprise.getAll((err, results) => res.json(results));
};

exports.getById = (req, res) => {
    Entreprise.getById(req.params.id, (err, results) => res.json(results[0]));
};

exports.create = (req, res) => {
    Entreprise.create(req.body, (err, result) => res.json({ id: result.insertId }));
};

exports.update = (req, res) => {
    Entreprise.update(req.params.id, req.body, (err) => res.json({ message: 'Mise à jour réussie' }));
};

exports.delete = (req, res) => {
    Entreprise.delete(req.params.id, (err) => res.json({ message: 'Suppression réussie' }));
};
