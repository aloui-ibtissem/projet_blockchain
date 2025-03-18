const Stage = require('../models/Stage');
const SujetStage = require('../models/SujetStage');
const { envoyerNotification } = require('../utils/notifications');

// Créer un stage après acceptation du sujet
exports.creerStage = (req, res) => {
    const { sujetId, etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, entrepriseId, dateDebut, dateFin, intervalleValidation } = req.body;

    // Vérifier que le sujet de stage existe et a été accepté
    SujetStage.getById(sujetId, (err, sujetResult) => {
        if (err) return res.status(500).send({ message: 'Erreur lors de la vérification du sujet de stage' });
        if (!sujetResult || sujetResult.length === 0) {
            return res.status(404).send({ message: 'Sujet de stage non trouvé' });
        }

        // Préparer les données à insérer dans la table Stage en fonction des champs disponibles dans la base
        const stageData = {
            etudiantId, 
            encadrantAcademiqueId, 
            encadrantProfessionnelId, 
            entrepriseId, 
            dateDebut, 
            dateFin, 
            intervalleValidation,
            etat: 'en attente' // Le stage commence en attente
        };

        // Créer le stage dans la base de données
        Stage.create(stageData, (err, stageResult) => {
            if (err) return res.status(500).send({ message: 'Erreur lors de la création du stage', error: err });

            // Envoi de notifications après la création du stage
            // Notification à l'étudiant
            envoyerNotification('Etudiant', `Votre stage avec le sujet "${sujetResult[0].titre}" a été créé avec succès et est en attente de validation.`);

            // Notification aux encadrants académiques
            envoyerNotification('Encadrants', `Le stage de l'étudiant ${etudiantId} a été créé et attend votre validation.`);

            // Notification à l'encadrant professionnel
            envoyerNotification('Encadrant Professionnel', `Le stage de l'étudiant ${etudiantId} a été créé et attend votre validation.`);

            res.status(201).send({ message: 'Stage créé avec succès', stageId: stageResult.insertId });
        });
    });
};
