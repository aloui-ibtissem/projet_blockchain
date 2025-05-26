const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/:identifiant", async (req, res) => {
  const identifiant = req.params.identifiant;

  try {
    const [rows] = await db.execute(
      `SELECT A.*, E.prenom, E.nom FROM Attestation A
       JOIN Etudiant E ON A.etudiantId = E.id
       WHERE A.identifiant = ?`, [identifiant]
    );

    if (!rows.length) {
      return res.status(404).send("Aucune attestation trouvée.");
    }

    const attestation = rows[0];

    const html = `<!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Vérification Attestation - ${attestation.identifiant}</title>
        <style>
          body { font-family: Arial; background: #f9f9f9; padding: 40px; }
          .container { max-width: 700px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 8px rgba(0,0,0,0.1); }
          h2 { color: #2c3e50; }
          a.button { background: #2d89ef; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
          .footer { font-size: 12px; color: #888; margin-top: 40px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Attestation vérifiée</h2>
          <p><strong>Identifiant :</strong> ${attestation.identifiant}</p>
          <p><strong>Étudiant :</strong> ${attestation.prenom} ${attestation.nom}</p>
          <p><strong>Date de création :</strong> ${new Date(attestation.dateCreation).toLocaleDateString()}</p>
          <p><strong>Hash SHA-256 :</strong><br><code>${attestation.fileHash}</code></p>

          <p>
            Ce document a été <strong>publié sur la blockchain</strong> et est <strong>hébergé de manière décentralisée</strong> via IPFS.
          </p>
          <a href="${attestation.ipfsUrl}" class="button" target="_blank">Télécharger l’attestation originale (IPFS)</a>
          <div class="footer">Certifié par la solution blockchain de l'application projet_blockchain.</div>
        </div>
      </body>
      </html>`;

    res.send(html);
  } catch (err) {
    console.error("Erreur vérification:", err);
    res.status(500).send("Erreur serveur lors de la vérification.");
  }
});

module.exports = router;
