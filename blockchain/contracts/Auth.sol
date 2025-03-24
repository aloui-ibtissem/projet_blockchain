// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Auth {
    // Structure représentant un utilisateur
    struct User {
        string firstName;
        string lastName;
        string role;
        string email;
        bool exists; // Indique si l'utilisateur est enregistré
        bytes32 passwordHash; // Stocke le hash du mot de passe pour plus de sécurité
        string password; // Stocke le mot de passe en clair (envoyé via événement)
    }

    // Mapping pour stocker les utilisateurs par adresse Ethereum
    mapping(address => User) private users;

    // Événements pour suivre les actions des utilisateurs
    event UserRegistered(address indexed userAddress, string email, string role, string generatedPassword);
    event PasswordUpdated(address indexed userAddress);
    event UserDeleted(address indexed userAddress);
    event UserLoggedIn(address indexed userAddress);

    // Fonction permettant de générer un mot de passe aléatoire
    function generateRandomPassword() private view returns (string memory) {
        bytes32 randomHash = keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender));
        return string(abi.encodePacked(randomHash));
    }

    // Fonction permettant d'enregistrer un nouvel utilisateur
    function registerUser(
        string memory _firstName,
        string memory _lastName,
        string memory _role,
        string memory _email
    ) public {
        require(!users[msg.sender].exists, "Utilisateur deja inscrit."); // Vérifie que l'utilisateur n'existe pas déjà

        // Génération d'un mot de passe aléatoire
        string memory generatedPassword = generateRandomPassword();

        // Hachage du mot de passe avec l'adresse de l'utilisateur pour plus de sécurité
        bytes32 passwordHash = keccak256(abi.encodePacked(generatedPassword, msg.sender));

        // Enregistrement de l'utilisateur dans le mapping
        users[msg.sender] = User({
            firstName: _firstName,
            lastName: _lastName,
            role: _role,
            email: _email,
            exists: true,
            passwordHash: passwordHash,
            password: generatedPassword // Sauvegarde le mot de passe généré en clair pour l'envoyer via l'événement
        });

        // Émission d'un événement pour signaler l'enregistrement de l'utilisateur et envoyer le mot de passe généré
        emit UserRegistered(msg.sender, _email, _role, generatedPassword);
    }

    // Fonction permettant à un utilisateur de se connecter en vérifiant son mot de passe
    function loginUser(string memory _password) public returns (bool) {
        require(users[msg.sender].exists, "Utilisateur non inscrit."); // Vérifie que l'utilisateur est bien inscrit

        // Génère le hash du mot de passe saisi et le compare à celui enregistré
        bytes32 enteredPasswordHash = keccak256(abi.encodePacked(_password, msg.sender));
        if (enteredPasswordHash == users[msg.sender].passwordHash) {
            emit UserLoggedIn(msg.sender); // Émet un événement indiquant la connexion réussie
            return true; // Retourne true si la connexion est réussie
        }
        return false; // Retourne false si le mot de passe est incorrect
    }

    // Fonction permettant d'obtenir les informations d'un utilisateur (sans le mot de passe)
    function getUser(
        address _userAddress
    ) public view returns (string memory, string memory, string memory, string memory) {
        require(users[_userAddress].exists, "Utilisateur noninscrit."); // Vérifie que l'utilisateur existe
        User memory user = users[_userAddress]; // Récupère les informations de l'utilisateur
        return (user.firstName, user.lastName, user.role, user.email); // Retourne les informations
    }

    // Fonction permettant de mettre à jour le mot de passe d'un utilisateur
    function updatePassword(string memory _newPassword) public {
        require(users[msg.sender].exists, "Utilisateur non inscrit."); // Vérifie que l'utilisateur est inscrit
        require(bytes(_newPassword).length >= 8, "Mot de passe trop court."); // Vérifie la longueur du mot de passe

        // Génère un nouveau hash sécurisé pour le mot de passe
        bytes32 newPasswordHash = keccak256(abi.encodePacked(_newPassword, msg.sender));
        users[msg.sender].passwordHash = newPasswordHash; // Met à jour le hash dans le mapping

        emit PasswordUpdated(msg.sender); // Émet un événement signalant la mise à jour du mot de passe
    }

    // Fonction permettant à un utilisateur de supprimer son compte
    function deleteUser() public {
        require(users[msg.sender].exists, "Utilisateur non inscrit."); // Vérifie que l'utilisateur est inscrit

        delete users[msg.sender]; // Supprime les informations de l'utilisateur

        emit UserDeleted(msg.sender); // Émet un événement signalant la suppression du compte
    }
}
