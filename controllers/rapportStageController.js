const RapportStage = require('../models/RapportStage');

exports.soumettreRapport = (req, res) => {
    RapportStage.create(req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: 'Rapport soumis avec succès' });
    });
};
