//cronJobs/rapportCron.js
const cron = require("node-cron");
const rapportService = require("../services/rapportService");

// Tous les jours 
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log(" CRON: Vérification rappels étudiants...");
    await rapportService.remindersCheck(); // Rappel aux étudiants
  } catch (err) {
    console.error("Erreur dans remindersCheck:", err);
  }
});

// Tous les jours "*/10 * * * *": chaque 10 minutes pour le développement //08*** si on passe au production a 8h par exemple
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log(" CRON: Vérification rappels encadrants...");
    await rapportService.remindersValidationCheck(); // Rappel aux encadrants
  } catch (err) {
    console.error("Erreur dans remindersValidationCheck:", err);
  }
});

// Tous les jours 
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log(" CRON: Vérification intervention tier...");
    await rapportService.checkForTierIntervention(); // Intervention automatique
  } catch (err) {
    console.error("Erreur dans checkForTierIntervention:", err);
  }
});
