const express = require('express');
const cors = require('cors');
require('dotenv').config();
const nodemailer = require('nodemailer');
const { Web3 } = require('web3');
const authRoutes = require("./routes/authRoutes"); // Importation des routes d'authentification
const db = require('./config/db'); // Assurez-vous que votre connexion à la base de données est configurée correctement


// Connexion au fournisseur HTTP
const web3 = new Web3("http://localhost:8545");

console.log("Web3 connecté avec succès !");

const app = express();
app.use(express.json());
app.use(cors());

// Routes d'authentification
app.use('./routes/authRoutes.js', authRoutes);
  
// Importation des routes
app.use('/universites', require('./routes/universiteRoutes'));
app.use('/entreprises', require('./routes/entrepriseRoutes'));
app.use('/etudiants', require('./routes/etudiantRoutes'));
app.use('/encadrants-academiques', require('./routes/encadrantAcademiqueRoutes'));
app.use('/encadrants-professionnels', require('./routes/encadrantProfessionnelRoutes'));

// Définition du contrat
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const contractABI = require('./abis/abi.json');n
const contract = new web3.eth.Contract(contractABI, contractAddress);

//  route d'inscription d'un utilisateur
app.post('/client/src/api.js', async (req, res) => {
  const { email, firstName, lastName, role } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length > 0) {
      return res.status(400).send({ message: "L'utilisateur existe déjà." });
    }

    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];

    try {
      // Enregistrement dans la blockchain
      await contract.methods.registerUser(firstName, lastName, role, email).send({ from: userAddress });
      const user = await contract.methods.getUser(userAddress).call();
      const generatedPassword = user[4];

      // Envoi de l'email
      const mailOptions = {
        from: process.env.EMAIL_USER,
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

      // Enregistrement dans la base de données locale
      db.query('INSERT INTO user (email, nom, prenom, role,password) VALUES (?, ?, ?, ?,?)', [email, nom, prenom, role,generatedPassword], (err, result) => {
        if (err) throw err;
        return res.status(200).send({ message: "Utilisateur enregistré avec succès." });
      });
    } catch (error) {
      return res.status(500).send({ message: "Erreur lors de l'enregistrement sur la blockchain." });
    }
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
