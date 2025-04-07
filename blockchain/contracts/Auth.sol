// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Auth - Gestion des utilisateurs avec rôles et authentification
/// @author 
/// @notice Ce contrat permet d’enregistrer, authentifier, et gérer les utilisateurs avec rôles

contract Auth {
    /// @dev Structure représentant un utilisateur
    struct User {
        string prenom;
        string nom;
        string email;
        string role;
        bytes32 passwordHash; // Mot de passe hashé (non stocké en clair)
        bool exists;          // Permet de vérifier l’inscription
    }

    /// @dev Mapping adresse utilisateur → structure User
    mapping(address => User) private users;

    /// @dev Pour éviter les doublons d’emails
    mapping(string => bool) private usedEmails;

    /// @dev Événements utiles pour l’audit et la traçabilité
    event UserRegistered(address indexed userAddress, string email, string role);
    event PasswordUpdated(address indexed userAddress, string email);
    event AccessChecked(address indexed userAddress, string role, bool accessGranted);

    /// @dev Modificateur : vérifie que l’utilisateur est déjà enregistré
    modifier onlyRegistered() {
        require(users[msg.sender].exists, "Utilisateur non enregistre.");
        _;
    }

    /// @notice Enregistre un nouvel utilisateur avec les informations de base + mot de passe hashé
    /// @param userAddress Adresse Ethereum de l'utilisateur
    /// @param prenom Prénom
    /// @param nom Nom
    /// @param email Adresse email
    /// @param role Rôle de l'utilisateur (ex: admin, user...)
    /// @param passwordHash Mot de passe préalablement hashé (bytes32)
    function registerUser(
        address userAddress,
        string memory prenom,
        string memory nom,
        string memory email,
        string memory role,
        bytes32 passwordHash
    ) public {
        require(!users[userAddress].exists, "Utilisateur deja enregistre.");
        require(!usedEmails[email], "Email deja utilise.");

        users[userAddress] = User({
            prenom: prenom,
            nom: nom,
            email: email,
            role: role,
            passwordHash: passwordHash,
            exists: true
        });

        usedEmails[email] = true;

        emit UserRegistered(userAddress, email, role);
    }

    /// @notice Vérifie l'identité de l'utilisateur en comparant email et mot de passe hashé
    /// @param email Email fourni
    /// @param passwordHash Hash du mot de passe fourni
    /// @return success True si les identifiants correspondent, false sinon
    /// @return userRole Rôle de l’utilisateur si succès, vide sinon
    function verifyLogin(
        string memory email,
        bytes32 passwordHash
    ) public view returns (bool success, string memory userRole) {
        User memory user = users[msg.sender];

        bool isEmailMatch = keccak256(abi.encodePacked(user.email)) == keccak256(abi.encodePacked(email));
        bool isPasswordMatch = user.passwordHash == passwordHash;

        if (isEmailMatch && isPasswordMatch) {
            return (true, user.role);
        } else {
            return (false, "");
        }
    }

    /// @notice Permet à un utilisateur connecté de changer son mot de passe
    /// @param newPasswordHash Nouveau mot de passe (déjà hashé)
    function updatePassword(bytes32 newPasswordHash) public onlyRegistered {
        users[msg.sender].passwordHash = newPasswordHash;
        emit PasswordUpdated(msg.sender, users[msg.sender].email);
    }

    /// @notice Récupère le rôle d’un utilisateur (utile pour afficher l’interface correspondante)
    /// @param userAddress Adresse à interroger
    function getRole(address userAddress) public view returns (string memory) {
        require(users[userAddress].exists, "Utilisateur non enregistre.");
        return users[userAddress].role;
    }

    /// @notice Vérifie si un utilisateur a le bon rôle pour accéder à une ressource
    /// @dev Cette version modifie l'état (événement) donc pas `view`
    function checkAccess(address userAddress, string memory requiredRole) public returns (bool) {
        bool access = (
            users[userAddress].exists &&
            keccak256(abi.encodePacked(users[userAddress].role)) == keccak256(abi.encodePacked(requiredRole))
        );

        emit AccessChecked(userAddress, requiredRole, access);
        return access;
    }

    /// @notice Version "lecture seule" de checkAccess, sans émettre d’événement
    function checkAccessView(address userAddress, string memory requiredRole) public view returns (bool) {
        return (
            users[userAddress].exists &&
            keccak256(abi.encodePacked(users[userAddress].role)) == keccak256(abi.encodePacked(requiredRole))
        );
    }

    /// @notice Vérifie si une adresse est déjà enregistrée
    function isRegistered(address userAddress) public view returns (bool) {
        return users[userAddress].exists;
    }

    /// @notice Récupère les infos publiques d’un utilisateur (sans mot de passe)
    function getUser(address userAddress)
        public
        view
        returns (string memory prenom, string memory nom, string memory email, string memory role)
    {
        require(users[userAddress].exists, "Utilisateur non enregistre.");
        User memory u = users[userAddress];
        return (u.prenom, u.nom, u.email, u.role);
    }
}
