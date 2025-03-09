const EncadrantProfessionnel = require('../models/EncadrantProfessionnel');

exports.getAll = (req, res) => {
    EncadrantProfessionnel.getAll((err, results) => res.json(results));
};

exports.getById = (req, res) => {
    EncadrantProfessionnel.getById(req.params.id, (err, results) => res.json(results[0]));
};

exports.create = (req, res) => {
    EncadrantProfessionnel.create(req.body, (err, result) => res.json({ id: result.insertId }));
};

exports.update = (req, res) => {
    EncadrantProfessionnel.update(req.params.id, req.body, (err) => res.json({ message: 'Mise à jour réussie' }));
};

exports.delete = (req, res) => {
    EncadrantProfessionnel.delete(req.params.id, (err) => res.json({ message: 'Suppression réussie' }));
};
