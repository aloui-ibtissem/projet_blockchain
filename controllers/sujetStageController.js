const SujetStage = require('../models/SujetStage');

exports.creerSujet = (req, res) => {
    SujetStage.create(req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: 'Sujet de stage créé avec succès' });
    });
};
