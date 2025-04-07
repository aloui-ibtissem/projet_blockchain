// Importation du modèle 'EncadrantAcademique' pour interagir avec la base de données
const EncadrantAcademique = require('../models/EncadrantAcademique');

// Fonction pour récupérer tous les encadrants académiques
exports.getAll = (req, res) => {
    // Appel de la méthode 'getAll' du modèle pour obtenir tous les encadrants
    // Les résultats sont ensuite envoyés au client au format JSON
    EncadrantAcademique.getAll((err, results) => res.json(results));
};

// Fonction pour récupérer un encadrant académique spécifique par son ID
exports.getById = (req, res) => {
    // Appel de la méthode 'getById' du modèle avec l'ID en paramètre
    // On retourne le premier résultat sous forme de JSON
    EncadrantAcademique.getById(req.params.id, (err, results) => res.json(results[0]));
};

// Fonction pour créer un nouvel encadrant académique
exports.create = (req, res) => {
    // Appel de la méthode 'create' du modèle avec les données envoyées dans le corps de la requête
    // On renvoie l'ID de l'enregistrement créé en réponse
    EncadrantAcademique.create(req.body, (err, result) => res.json({ id: result.insertId }));
};

// Fonction pour mettre à jour un encadrant académique existant
exports.update = (req, res) => {
    // Appel de la méthode 'update' du modèle pour mettre à jour l'encadrant avec l'ID et les nouvelles données
    // On renvoie un message de confirmation après la mise à jour réussie
    EncadrantAcademique.update(req.params.id, req.body, (err) => res.json({ message: 'Mise à jour réussie' }));
};

// Fonction pour supprimer un encadrant académique
exports.delete = (req, res) => {
    // Appel de la méthode 'delete' du modèle pour supprimer un encadrant 
}