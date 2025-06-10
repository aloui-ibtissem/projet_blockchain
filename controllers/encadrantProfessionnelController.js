// Importation du modèle 'EncadrantProfessionnel'
const EncadrantProfessionnel = require('../models/EncadrantProfessionnel');

// Récupère tous les encadrants professionnels et les retourne en JSON
exports.getAll = (req, res) => {
    EncadrantProfessionnel.getAll((err, results) => res.json(results));
};

// Récupère un encadrant professionnel par son ID et le retourne en JSON
exports.getById = (req, res) => {
    EncadrantProfessionnel.getById(req.params.id, (err, results) => res.json(results[0]));
};

// Crée un nouvel encadrant professionnel et renvoie l'ID de l'enregistrement
exports.create = (req, res) => {
    EncadrantProfessionnel.create(req.body, (err, result) => res.json({ id: result.insertId }));
};

// Met à jour un encadrant professionnel par son ID et renvoie un message de confirmation
exports.update = (req, res) => {
    EncadrantProfessionnel.update(req.params.id, req.body, (err) => res.json({ message: 'Mise à jour réussie' }));
};

// Supprime un encadrant professionnel par son ID et renvoie un message de confirmation
exports.delete = (req, res) => {
    EncadrantProfessionnel.delete(req.params.id, (err) => res.json({ message: 'Suppression réussie' }));
};
//
