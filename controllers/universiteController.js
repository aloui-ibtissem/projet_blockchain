const Universite = require('../models/Universite');

exports.getAll = (req, res) => { Universite.getAll((err, results) => res.json(results)); };
exports.getById = (req, res) => { Universite.getById(req.params.id, (err, results) => res.json(results[0])); };
exports.create = (req, res) => { Universite.create(req.body, (err, result) => res.json({ id: result.insertId })); };
exports.update = (req, res) => { Universite.update(req.params.id, req.body, (err) => res.json({ message: 'Mise à jour réussie' })); };
exports.delete = (req, res) => { Universite.delete(req.params.id, (err) => res.json({ message: 'Suppression réussie' })); };
