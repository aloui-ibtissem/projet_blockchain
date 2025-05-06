const express = require("express");
const router = express.Router();
const rapportController = require("../controllers/rapportStageController");
const upload = require("../middlewares/upload");
const checkToken = require("../middlewares/checkToken");

router.post("/submit", checkToken, upload.single("fichier"), rapportController.submitRapport);
router.post("/comment", checkToken, rapportController.commentRapport);
router.post("/validate", checkToken, rapportController.validateRapport);

router.get("/commentaires/:rapportId", checkToken, rapportController.getCommentaires);
router.get("/encadrant", checkToken, rapportController.getRapportsEncadrant);
router.get("/mes-rapports", checkToken, rapportController.getMesRapports);

module.exports = router;
