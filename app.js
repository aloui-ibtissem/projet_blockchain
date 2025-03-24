const express = require('express');
const cors = require('cors');
require('dotenv').config();
const nodemailer = require('nodemailer');
const Web3 = require('web3');

const app = express();

app.use(express.json());
app.use(cors());

// Routes spécifiques aux différentes entités
app.use('/universites', require('./routes/universiteRoutes'));
app.use('/entreprises', require('./routes/entrepriseRoutes'));
app.use('/etudiants', require('./routes/etudiantRoutes'));
app.use('/encadrants-academiques', require('./routes/encadrantAcademiqueRoutes'));
app.use('/encadrants-professionnels', require('./routes/encadrantProfessionnelRoutes'));

// Routes pour le stage, sujet de stage, rapport, et évaluation
app.use('/api/stages', require('./routes/stageRoutes'));
app.use('/api/sujets-stage', require('./routes/sujetStageRoutes'));
app.use('/api/rapports-stage', require('./routes/rapportStageRoutes'));
app.use('/api/evaluations', require('./routes/evaluationRoutes'));



// Configuration Web3 pour interagir avec la blockchain
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Localhost or  preferred network URL

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Address of deployed contract
const contractABI = require('./contractABI.json'); // ABI of the contract
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Configurer le transporteur de Nodemailer pour envoyer des emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password',
  },
});

// Fonction pour générer un mot de passe aléatoire
function generateRandomPassword() {
  return Math.random().toString(36).slice(-8); // Génère un mot de passe aléatoire simple
}

// Inscription d'un utilisateur
app.post('/api/register', async (req, res) => {
  const { email, firstName, lastName, role } = req.body;

  // Vérification si l'utilisateur existe dans la base de données MySQL
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length > 0) {
      return res.status(400).send({ message: "L'utilisateur existe déjà." });
    }

    // Interaction avec la blockchain pour enregistrer l'utilisateur
    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];

    try {
      // Enregistrer l'utilisateur sur la blockchain
      await contract.methods.registerUser(firstName, lastName, role, email).send({ from: userAddress });

      // Récupérer le mot de passe généré par le smart contract
      const user = await contract.methods.getUser(userAddress).call();
      const generatedPassword = user[4]; // Le mot de passe est le 5e champ dans le tuple retourné

      // Envoi du mot de passe par email
      const mailOptions = {
        from: 'your_email@gmail.com',
        to: email,
        subject: 'Votre mot de passe généré',
        text: `Votre mot de passe est : ${generatedPassword}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send({ message: "Erreur d'envoi d'email." });
        }
        console.log('Email envoyé: ' + info.response);
      });

      // Enregistrer l'utilisateur dans MySQL après avoir validé l'enregistrement sur la blockchain
      db.query('INSERT INTO users (email, first_name, last_name, role) VALUES (?, ?, ?, ?)', [email, firstName, lastName, role], (err, result) => {
        if (err) throw err;
        return res.status(200).send({ message: "Utilisateur enregistré avec succès." });
      });
    } catch (error) {
      return res.status(500).send({ message: "Erreur lors de l'enregistrement sur la blockchain." });
    }
  });
});

// Mise à jour du mot de passe de l'utilisateur
app.post('/api/updatePassword', async (req, res) => {
  const { email, newPassword } = req.body;

  // Vérification de l'utilisateur dans MySQL
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length === 0) {
      return res.status(400).send({ message: "Utilisateur non trouvé." });
    }

    const user = results[0];

    // Vérification de l'existence de l'utilisateur dans la blockchain
    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];

    try {
      // Mise à jour du mot de passe sur la blockchain
      await contract.methods.updatePassword(newPassword).send({ from: userAddress });

      // Enregistrer le nouveau mot de passe dans MySQL si nécessaire
      db.query('UPDATE users SET password = ? WHERE email = ?', [newPassword, email], (err, result) => {
        if (err) throw err;
        return res.status(200).send({ message: "Mot de passe mis à jour avec succès." });
      });
    } catch (error) {
      return res.status(500).send({ message: "Erreur lors de la mise à jour du mot de passe sur la blockchain." });
    }
  });
});


// Démarrage du serveur
app.listen(process.env.PORT || 3000, () => console.log('Serveur démarré'));