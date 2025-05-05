const express = require("express");
const router = express.Router();
const controller = require("../controllers/attestationController");
const auth = require("../middlewares/checkToken");
const upload = require("../middlewares/uploadAttestation");

router.use(auth);

router.post("/upload", upload.single("fichier"), controller.uploadAttestation);
router.post("/valider", controller.validateOnChain); // peut être intégré dans le même endpoint

module.exports = router;
