// controllers/RapportStageController.js
const RapportStage = require('../models/RapportStage');
const EvaluationRapport = require('../models/EvaluationRapport');
const { envoyerNotification } = require('../utils/notifications');

// Soumettre un rapport de stage
exports.soumettreRapport = (req, res) => {
    const { stageId, etudiantId, dateSoumission, fichier } = req.body;

    const rapportData = {
        stageId,
        etudiantId,
        dateSoumission,
        statutAcademique: false,
        statutProfessionnel: false,
    };

    RapportStage.create(rapportData, (err, result) => {
        if (err) return res.status(500).send(err);

        // Notification à l'étudiant
        envoyerNotification('Etudiant', 'Votre rapport a été soumis.');

        // Notification aux encadrants pour qu'ils évaluent le rapport
        envoyerNotification('Academique', 'Un rapport de stage a été soumis pour évaluation.');
        envoyerNotification('Professionnel', 'Un rapport de stage a été soumis pour évaluation.');

        res.status(201).send({ message: 'Rapport soumis avec succès.' });
    });
};
