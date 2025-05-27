// utils/hashUtils.js
const fs = require("fs").promises;
const crypto = require("crypto");

/**
 * Calcule le hash SHA-256 d’un fichier local (PDF, rapport, etc.)
 * @param {string} filePath - Chemin du fichier à hasher
 * @returns {Promise<string>} hash hexadécimal
 */
exports.hashFile = async (filePath) => {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
};
