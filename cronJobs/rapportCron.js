// cronJobs/rapportCron.js
const rapportService = require("../services/rapportService");

(async () => {
  try {
    await rapportService.remindersCheck(); // Étudiants (soumission)
    await rapportService.remindersValidationCheck(); // Encadrants (validation)
    await rapportService.checkForTierIntervention(); // Tier débloqueur (si besoin)
    console.log(" CRON rapportService terminé avec succès.");
  } catch (err) {
    console.error(" Erreur lors du CRON rapportService:", err);
  }
})();


