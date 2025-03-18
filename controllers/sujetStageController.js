// controllers/SujetStageController.js
const SujetStage = require('../models/SujetStage');
const Stage = require('../models/Stage');
const { envoyerNotification } = require('../utils/notifications');

// L'étudiant propose un sujet de stage aux encadrants
exports.proposerSujetStage = (req, res) => {
    const { etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, titre, description } = req.body;

    const data = {
        etudiantId,
        encadrantAcademiqueId,
        encadrantProfessionnelId,
        titre,
        description,
        status: 'en attente' // Initialement, le sujet est en attente de validation
    };

    SujetStage.create(data, (err, result) => {
        if (err) return res.status(500).send({ message: 'Erreur lors de la proposition du sujet.', error: err });

        // Envoyer une notification aux encadrants pour qu'ils valident le sujet
        envoyerNotification('Encadrants', 'Un étudiant a proposé un sujet de stage. Veuillez l\'accepter ou le refuser.');

        res.status(201).send({ message: 'Sujet de stage proposé avec succès. En attente de validation.' });
    });
};

// Gérer l'acceptation ou le refus de la proposition de sujet
exports.gererProposition = (req, res) => {
    const { sujetId, statutAcademique, statutProfessionnel } = req.body;

    // Vérification du statut des encadrants (académique et professionnel)
    SujetStage.getById(sujetId, (err, result) => {
        if (err) return res.status(500).send({ message: 'Erreur lors de la récupération du sujet de stage.', error: err });
        if (result.length === 0) {
            return res.status(404).send({ message: 'Sujet de stage introuvable.' });
        }

        const sujet = result[0];
        
        // Mise à jour du statut
        const updatedStatus = {
            statutAcademique,
            statutProfessionnel,
            status: (statutAcademique && statutProfessionnel) ? 'validé' : 'en attente'
        };

        SujetStage.updateStatus(sujetId, updatedStatus, (err) => {
            if (err) return res.status(500).send({ message: 'Erreur lors de la mise à jour du statut.', error: err });

            // Si les deux encadrants acceptent, création du stage
            if (statutAcademique && statutProfessionnel) {
                const stageData = {
                    etudiantId: sujet.etudiantId,
                    encadrantAcademiqueId: sujet.encadrantAcademiqueId,
                    encadrantProfessionnelId: sujet.encadrantProfessionnelId,
                    entrepriseId: 1, // À remplacer par la logique réelle pour l'entreprise
                    dateDebut: '2023-09-01', // Exemple de date de début
                    dateFin: '2023-12-01',  // Exemple de date de fin
                    intervalleValidation: 7, // Exemple d'intervalle de validation
                    etat: 'en attente'
                };

                // Créer le stage
                Stage.create(stageData, (err, result) => {
                    if (err) return res.status(500).send({ message: 'Erreur lors de la création du stage.', error: err });

                    // Mise à jour du sujet avec le stageId
                    SujetStage.updateStageId(sujetId, result.insertId, (err) => {
                        if (err) return res.status(500).send({ message: 'Erreur lors de la mise à jour du stageId dans le sujet.', error: err });

                        // Notification à l'étudiant que le stage a été créé
                        envoyerNotification('Etudiant', 'Votre stage a été créé avec succès !');

                        // Notification aux encadrants (académique et professionnel)
                        envoyerNotification('Academique', 'Le stage de votre étudiant a été validé.');
                        envoyerNotification('Professionnel', 'Le stage de votre étudiant a été validé.');

                        res.status(200).send({ message: 'Stage créé avec succès et sujet mis à jour.' });
                    });
                });
            } else {
                // Si l'un des encadrants refuse, notifier l'étudiant
                envoyerNotification('Etudiant', 'Votre sujet de stage n\'a pas été validé par les encadrants.');

                res.status(200).send({ message: 'Sujet de stage en attente de validation complète.' });
            }
        });
    });
};
