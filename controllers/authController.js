const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Web3 } = require('web3');
const web3 = new Web3("http://localhost:8545");
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const contractABI = require('../abis/abi.json');
const contract = new web3.eth.Contract(contractABI, contractAddress);
const db = require('../config/db');

const registerUser = async (req, res) => {
  const { email, firstName, lastName, role } = req.body;
  try {
    const accounts = await web3.eth.getAccounts();
    const userAddress = accounts[0];

    await contract.methods.registerUser(firstName, lastName, role, email).send({ from: userAddress });
    const user = await contract.methods.getUser(userAddress).call();

    // Logique pour enregistrer l'utilisateur dans la base de données et envoyer un email
    db.query('INSERT INTO users (email, first_name, last_name, role) VALUES (?, ?, ?, ?)', [email, firstName, lastName, role], (err, result) => {
      if (err) throw err;
      res.status(200).send({ message: "Utilisateur enregistré avec succès." });
    });
  } catch (error) {
    res.status(500).send({ message: "Erreur lors de l'enregistrement." });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  // Assurez-vous de vérifier l'email et le mot de passe ici
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length === 0) return res.status(400).send({ message: "Utilisateur non trouvé." });

    const user = results[0];
    // Comparer le mot de passe hashé
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(400).send({ message: "Mot de passe incorrect." });

    // Générer un token JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).send({ token });
  });
};

module.exports = { registerUser, loginUser };
