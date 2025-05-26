require("dotenv").config();
let BASE_URL = process.env.PUBLIC_URL || process.env.FRONTEND_URL || "http://localhost:3000";

// Permet de changer dynamiquement l'URL de base (utile pour tests/ngrok)
function setBaseUrl(newUrl) {
  BASE_URL = newUrl;
}

// Utilise toujours la valeur actuelle de BASE_URL
function buildUrl(path) {
  return `${BASE_URL}${path}`;
}

module.exports = {
  buildUrl,
  setBaseUrl,
};
