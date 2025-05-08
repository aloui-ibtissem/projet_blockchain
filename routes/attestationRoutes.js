const express = require("express");
const router = express.Router();
const attestationController = require("../controllers/attestationController");
const checkToken = require("../middlewares/checkToken");

router.post("/generer", checkToken, attestationController.genererAttestation);

module.exports = router;
