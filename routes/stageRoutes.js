const express = require("express");
const router = express.Router();
const stageController = require("../controllers/stageController");
const auth = require("../middlewares/checkToken");
const upload = require("../middlewares/upload");

router.post("/propose", auth, stageController.proposeStage);
router.post("/validate-sujet", auth, stageController.validateSujet);
router.post("/submitReport", auth, upload.single("rapport"), stageController.submitReport);
router.post("/validateReport", auth, stageController.validateReport);
router.get("/current", auth, stageController.getCurrentStage);

router.get("/encadrements", auth, stageController.getEncadrementsAca);
router.get("/encadrementsPro", auth, stageController.getEncadrementsPro);

router.get("/notifications", auth, stageController.getNotifications);
router.get("/rapports", auth, stageController.getRapportsEncadrant); // pour encadrant
router.post("/commenter-rapport", auth, stageController.commenterRapport); // ajouter un commentaire


router.get("/propositions", auth, stageController.getPropositionsAca);
router.get("/propositionsPro", auth, stageController.getPropositionsPro);




module.exports = router;
