// utils/notifications.js
const sendNotification = (to, subject, message) => {
    // Logique de notification
    // Cette fonction peut être utilisée pour envoyer un email, une notification push, ou une autre forme de notification
    console.log(`Notification to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
};

const envoyerNotification = (role, message) => {
    switch (role) {
        case 'Encadrants':
            sendNotification('Encadrants', 'Proposition de sujet de stage', message);
            break;
        case 'Etudiant':
            sendNotification('Etudiant', 'Mise à jour du sujet de stage', message);
            break;
        case 'Academique':
            sendNotification('Encadrant Académique', 'Validation du sujet de stage', message);
            break;
        case 'Professionnel':
            sendNotification('Encadrant Professionnel', 'Validation du sujet de stage', message);
            break;
        default:
            console.log('Rôle inconnu pour la notification');
    }
};

module.exports = { envoyerNotification };
