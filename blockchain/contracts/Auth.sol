// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Déclare la version du compilateur Solidity

// Le contrat Auth permet l'enregistrement et la consultation des informations des utilisateurs.
contract Auth {
    // Définition de la structure User pour stocker les informations des utilisateurs
    struct User {
        string name; // Nom de l'utilisateur
        string email; // Email de l'utilisateur
        address ethAddress; // Adresse Ethereum de l'utilisateur
        string role; // Rôle de l'utilisateur (par exemple : "admin", "user")
        bool registered; // Indicateur si l'utilisateur est inscrit ou non
    }

    // Mapping pour associer chaque adresse Ethereum à un utilisateur
    mapping(address => User) private users;

    // Déclaration de l'événement qui sera émis lorsque l'utilisateur s'enregistre
    event UserRegistered(
        address indexed userAddress,
        string name,
        string email,
        string role
    );

    // Fonction pour enregistrer un utilisateur
    function registerUser(
        string memory _name,
        string memory _email,
        string memory _role
    ) public {
        // Vérifie si l'utilisateur est déjà inscrit, il ne peut pas s'inscrire deux fois
        require(!users[msg.sender].registered, "User already registered");

        // Enregistre l'utilisateur dans le mapping `users`
        users[msg.sender] = User(_name, _email, msg.sender, _role, true);

        // Émet un événement pour notifier l'enregistrement de l'utilisateur
        emit UserRegistered(msg.sender, _name, _email, _role);
    }

    // Fonction pour récupérer les informations d'un utilisateur par son adresse Ethereum
    function getUser(
        address _userAddress
    )
        public
        view
        returns (string memory, string memory, address, string memory, bool)
    {
        // Récupère les informations de l'utilisateur dans le mapping
        User memory user = users[_userAddress];

        // Vérifie si l'utilisateur est enregistré, sinon retourne une erreur
        require(user.registered, "User not found");

        // Retourne les informations de l'utilisateur (nom, email, adresse, rôle, état d'enregistrement)
        return (
            user.name,
            user.email,
            user.ethAddress,
            user.role,
            user.registered
        );
    }
}
