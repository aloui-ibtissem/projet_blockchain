const EvaluationRapport = require('../models/EvaluationRapport');

exports.evaluerRapport = (req, res) => {
    EvaluationRapport.create(req.body, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: 'Évaluation soumise avec succès' });
    });
};
