// cronJobs/testTierCron.js
const rapportService = require("../services/rapportService");

(async () => {
  try {
    console.log("[TEST] Lancement manuel de checkForTierIntervention...");
    await rapportService.checkForTierIntervention();
    console.log("[TEST] Terminé avec succès.");
  } catch (err) {
    console.error("[TEST] Erreur :", err);
  }
})();
