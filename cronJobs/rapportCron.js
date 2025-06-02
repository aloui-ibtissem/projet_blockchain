//cronJobs/rapportCron.js
const cron = require("node-cron");
const rapportService = require("../services/rapportService");

// Rappel étudiants toutes les 10 minutes
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log("CRON: Rappel — Étudiants");
    await rapportService.remindersCheck();
  } catch (err) {
    console.error("Erreur remindersCheck:", err);
  }
});

// Rappel encadrants toutes les 10 minutes
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log("CRON: Rappel — Encadrants");
    await rapportService.remindersValidationCheck();
  } catch (err) {
    console.error("Erreur remindersValidationCheck:", err);
  }
});

// Vérification tier chaque 10 minutes
cron.schedule("*/10 * * * *", async () => {
  try {
    console.log("CRON: Intervention — Tier");
    await rapportService.checkForTierIntervention();
  } catch (err) {
    console.error("Erreur checkForTierIntervention:", err);
  }
});