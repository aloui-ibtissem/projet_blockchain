// reset.js
const axios = require("axios");

const address = process.argv[2];

if (!address) {
  console.error("❌ Veuillez fournir une adresse Ethereum en argument.");
  console.log("Exemple : node reset.js 0x1234abcd...");
  process.exit(1);
}

async function resetRole() {
  try {
    const response = await axios.post("http://localhost:3000/api/auth/reset-role", {
      address
    });

    console.log(" Réponse du serveur :", response.data);
  } catch (err) {
    console.error("Erreur :", err.response?.data || err.message);
  }
}

resetRole();
