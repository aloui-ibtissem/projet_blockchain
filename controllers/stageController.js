const Stage = require('../models/Stage');
const { envoyerNotification } = require('../utils/notifications');

exports.creerStage = (req, res) => {
    Stage.create(req.body, (err, result) => {
        if (err) return res.status(500).send(err);

        envoyerNotification('Encadrants', 'Un étudiant a proposé un stage.');
        res.status(201).send({ message: 'Stage créé avec succès' });
    });
};
