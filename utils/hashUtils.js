// utils/hashUtils.js
const fs = require("fs");
const crypto = require("crypto");

/**
 * Calcule le hash SHA-256 d’un fichier local (PDF, rapport, etc.)
 * @param {string} filePath - Chemin du fichier à hasher
 * @returns {string} hash hexadécimal
 */
exports.hashFile = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha256");
  hash.update(fileBuffer);
  return hash.digest("hex");
};
