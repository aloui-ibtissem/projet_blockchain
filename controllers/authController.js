const Web3 = require('web3');
const { User } = require('/models/user'); // Sequelize User Model
const web3 = new Web3('http://localhost:8545'); // Connecter à la blockchain locale ou à un RPC

// Importation de l'ABI (Application Binary Interface) du contrat intelligent à partir d'un fichier JSON
const contractABI = require("../abis/abis.json");
// Définition de l'adresse du contrat  déployé
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

const contract = new web3.eth.Contract(contractABI, contractAddress);

// Fonction d'inscription de l'utilisateur
async function registerUser(req, res) {
    const { firstName, lastName, email, role, password } = req.body;

    // Vérification si l'utilisateur existe déjà dans MySQL
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).send('Utilisateur déjà inscrit');
    }

    // Générer un hash du mot de passe
    const passwordHash = web3.utils.keccak256(password);

    // Enregistrer l'utilisateur dans MySQL
    const user = await User.create({ firstName, lastName, email, role, password: passwordHash });

    // Enregistrer l'utilisateur sur la blockchain
    const accounts = await web3.eth.getAccounts();
    await contract.methods.registerUser(accounts[0], firstName, lastName, email, role, passwordHash).send({ from: accounts[0] });

    res.status(200).send('Utilisateur inscrit');
}

// Fonction de connexion de l'utilisateur
async function loginUser(req, res) {
    const { email, password } = req.body;

    // Vérification de l'utilisateur dans MySQL
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(400).send('Utilisateur non trouvé');
    }

    // Comparer le mot de passe soumis avec le hash stocké dans la base de données
    const passwordHash = web3.utils.keccak256(password);
    if (passwordHash !== user.password) {
        return res.status(400).send('Mot de passe incorrect');
    }

    // Vérifier le rôle sur la blockchain
    const role = await contract.methods.getUserRole(user.id).call();
    if (role !== user.role) {
        return res.status(400).send('Rôle incorrect');
    }

    // Authentification réussie
    res.status(200).send('Connexion réussie');
}
