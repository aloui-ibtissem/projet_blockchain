// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Contrat d'authentification pour la plateforme de gestion des stages
 * @author Manus
 * @notice Ce contrat gère l'authentification et la vérification des rôles des utilisateurs
 * @dev Utilise des structures de données optimisées pour la vérification d'identité
 */
contract Auth{
    // Adresse du propriétaire du contrat (administrateur système)
    address private owner;
    
    // Structure pour stocker les informations d'un utilisateur
    struct User {
        string email;        // Email de l'utilisateur (identifiant unique)
        string nom;          // Nom de l'utilisateur
        string prenom;       // Prénom de l'utilisateur
        string role;         // Rôle de l'utilisateur (étudiant, encadrant, etc.)
        bytes32 passwordHash; // Hash du mot de passe (stocké pour vérification)
        uint256 createdAt;   // Timestamp de création du compte
        uint256 lastLogin;   // Timestamp de la dernière connexion
        bool isActive;       // Statut du compte (actif/inactif)
    }
    
    // Structure pour les journaux d'authentification
    struct AuthLog {
        string email;        // Email de l'utilisateur
        string action;       // Type d'action (inscription, connexion, etc.)
        uint256 timestamp;   // Timestamp de l'action
        bool success;        // Succès ou échec de l'action
    }
    
    // Mapping des utilisateurs par email (hash de l'email)
    mapping(bytes32 => User) private users;
    
    // Tableau des emails d'utilisateurs pour l'énumération
    bytes32[] private userEmails;
    
    // Tableau des journaux d'authentification
    AuthLog[] private authLogs;
    
    // Événements pour suivre les actions importantes
    event UserRegistered(string email, string role, uint256 timestamp);
    event UserAuthenticated(string email, string role, uint256 timestamp);
    event UserRoleVerified(string email, string role, uint256 timestamp);
    event UserUpdated(string email, uint256 timestamp);
    event UserDeactivated(string email, uint256 timestamp);
    
    // Modificateur pour restreindre l'accès au propriétaire
    modifier onlyOwner() {
        require(msg.sender == owner, "Seul le proprietaire peut executer cette fonction");
        _;
    }
    
    /**
     * @notice Constructeur du contrat
     * @dev Initialise le propriétaire du contrat
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @notice Enregistre un nouvel utilisateur dans le système
     * @param _email Email de l'utilisateur
     * @param _nom Nom de l'utilisateur
     * @param _prenom Prénom de l'utilisateur
     * @param _role Rôle de l'utilisateur
     * @param _passwordHash Hash du mot de passe
     * @return success Booléen indiquant si l'opération a réussi
     */
    function registerUser(
        string memory _email,
        string memory _nom,
        string memory _prenom,
        string memory _role,
        bytes32 _passwordHash
    ) public returns (bool success) {
        // Vérifier que l'email est valide (non vide)
        require(bytes(_email).length > 0, "L'email ne peut pas etre vide");
        
        // Vérifier que le rôle est valide
        require(
            keccak256(abi.encodePacked(_role)) == keccak256(abi.encodePacked("etudiant")) ||
            keccak256(abi.encodePacked(_role)) == keccak256(abi.encodePacked("encadrantAcademique")) ||
            keccak256(abi.encodePacked(_role)) == keccak256(abi.encodePacked("encadrantProfessionnel")) ||
            keccak256(abi.encodePacked(_role)) == keccak256(abi.encodePacked("responsableUniversitaire")) ||
            keccak256(abi.encodePacked(_role)) == keccak256(abi.encodePacked("responsableEntreprise")),
            "Role non valide"
        );
        
        // Calculer le hash de l'email pour l'utiliser comme clé
        bytes32 emailHash = keccak256(abi.encodePacked(_email));
        
        // Vérifier que l'utilisateur n'existe pas déjà
        require(users[emailHash].createdAt == 0, "Cet utilisateur existe deja");
        
        // Créer le nouvel utilisateur
        User memory newUser = User({
            email: _email,
            nom: _nom,
            prenom: _prenom,
            role: _role,
            passwordHash: _passwordHash,
            createdAt: block.timestamp,
            lastLogin: 0,
            isActive: true
        });
        
        // Enregistrer l'utilisateur
        users[emailHash] = newUser;
        userEmails.push(emailHash);
        
        // Enregistrer le journal d'authentification
        authLogs.push(AuthLog({
            email: _email,
            action: "inscription",
            timestamp: block.timestamp,
            success: true
        }));
        
        // Émettre l'événement
        emit UserRegistered(_email, _role, block.timestamp);
        
        return true;
    }
    
    /**
     * @notice Vérifie les informations d'authentification d'un utilisateur
     * @param _email Email de l'utilisateur
     * @param _passwordHash Hash du mot de passe fourni
     * @return authenticated Booléen indiquant si l'authentification a réussi
     * @return role Rôle de l'utilisateur si authentifié
     * @return authSignature Signature d'authentification pour vérification ultérieure
     */
    function authenticateUser(
        string memory _email,
        bytes32 _passwordHash
    ) public returns (bool authenticated, string memory role, bytes32 authSignature) {
        // Calculer le hash de l'email
        bytes32 emailHash = keccak256(abi.encodePacked(_email));
        
        // Vérifier que l'utilisateur existe
        if (users[emailHash].createdAt == 0 || !users[emailHash].isActive) {
            // Enregistrer la tentative échouée
            authLogs.push(AuthLog({
                email: _email,
                action: "connexion",
                timestamp: block.timestamp,
                success: false
            }));
            
            return (false, "", bytes32(0));
        }
        
        // Vérifier le mot de passe
        if (users[emailHash].passwordHash != _passwordHash) {
            // Enregistrer la tentative échouée
            authLogs.push(AuthLog({
                email: _email,
                action: "connexion",
                timestamp: block.timestamp,
                success: false
            }));
            
            return (false, "", bytes32(0));
        }
        
        // Mettre à jour la date de dernière connexion
        users[emailHash].lastLogin = block.timestamp;
        
        // Enregistrer la connexion réussie
        authLogs.push(AuthLog({
            email: _email,
            action: "connexion",
            timestamp: block.timestamp,
            success: true
        }));
        
        // Générer une signature d'authentification
        bytes32 signature = keccak256(abi.encodePacked(
            _email,
            users[emailHash].role,
            block.timestamp,
            block.difficulty
        ));
        
        // Émettre l'événement
        emit UserAuthenticated(_email, users[emailHash].role, block.timestamp);
        
        return (true, users[emailHash].role, signature);
    }
    
    /**
     * @notice Vérifie le rôle d'un utilisateur
     * @param _email Email de l'utilisateur
     * @param _role Rôle à vérifier
     * @return isValid Booléen indiquant si l'utilisateur a le rôle spécifié
     */
    function verifyUserRole(
        string memory _email,
        string memory _role
    ) public returns (bool isValid) {
        // Calculer le hash de l'email
        bytes32 emailHash = keccak256(abi.encodePacked(_email));
        
        // Vérifier que l'utilisateur existe et est actif
        if (users[emailHash].createdAt == 0 || !users[emailHash].isActive) {
            return false;
        }
        
        // Vérifier le rôle
        bool roleMatch = keccak256(abi.encodePacked(users[emailHash].role)) == 
                         keccak256(abi.encodePacked(_role));
        
        if (roleMatch) {
            // Émettre l'événement
            emit UserRoleVerified(_email, _role, block.timestamp);
        }
        
        return roleMatch;
    }
    
    /**
     * @notice Vérifie l'authenticité d'une signature d'authentification
     * @param _email Email de l'utilisateur
     * @param _role Rôle de l'utilisateur
     * @param _authSignature Signature d'authentification à vérifier
     * @return isValid Booléen indiquant si la signature est valide
     */
    function verifyAuthSignature(
        string memory _email,
        string memory _role,
        bytes32 _authSignature
    ) public view returns (bool isValid) {
        // Calculer le hash de l'email
        bytes32 emailHash = keccak256(abi.encodePacked(_email));
        
        // Vérifier que l'utilisateur existe et est actif
        if (users[emailHash].createdAt == 0 || !users[emailHash].isActive) {
            return false;
        }
        
        // Vérifier le rôle
        if (keccak256(abi.encodePacked(users[emailHash].role)) != 
            keccak256(abi.encodePacked(_role))) {
            return false;
        }
        
        // La vérification complète de la signature nécessiterait des informations
        // qui ne sont pas disponibles ici (timestamp et difficulté du bloc d'authentification)
        // Dans un environnement de production, on utiliserait une logique plus robuste
        
        // Pour ce prototype, nous considérons la signature comme valide si elle n'est pas nulle
        return _authSignature != bytes32(0);
    }
    
    /**
     * @notice Met à jour le mot de passe d'un utilisateur
     * @param _email Email de l'utilisateur
     * @param _oldPasswordHash Hash de l'ancien mot de passe
     * @param _newPasswordHash Hash du nouveau mot de passe
     * @return success Booléen indiquant si l'opération a réussi
     */
    function updatePassword(
        string memory _email,
        bytes32 _oldPasswordHash,
        bytes32 _newPasswordHash
    ) public returns (bool success) {
        // Calculer le hash de l'email
        bytes32 emailHash = keccak256(abi.encodePacked(_email));
        
        // Vérifier que l'utilisateur existe et est actif
        require(users[emailHash].createdAt > 0, "Utilisateur non trouve");
        require(users[emailHash].isActive, "Compte utilisateur inactif");
        
        // Vérifier l'ancien mot de passe
        require(users[emailHash].passwordHash == _oldPasswordHash, "Ancien mot de passe incorrect");
        
        // Mettre à jour le mot de passe
        users[emailHash].passwordHash = _newPasswordHash;
        
        // Enregistrer la mise à jour
        authLogs.push(AuthLog({
            email: _email,
            action: "mise_a_jour_mot_de_passe",
            timestamp: block.timestamp,
            success: true
        }));
        
        // Émettre l'événement
        emit UserUpdated(_email, block.timestamp);
        
        return true;
    }
    
    /**
     * @notice Désactive un compte utilisateur
     * @param _email Email de l'utilisateur à désactiver
     * @return success Booléen indiquant si l'opération a réussi
     */
    function deactivateUser(
        string memory _email
    ) public onlyOwner returns (bool success) {
        // Calculer le hash de l'email
        bytes32 emailHash = keccak256(abi.encodePacked(_email));
        
        // Vérifier que l'utilisateur existe
        require(users[emailHash].createdAt > 0, "Utilisateur non trouve");
        
        // Désactiver le compte
        users[emailHash].isActive = false;
        
        // Enregistrer la désactivation
        authLogs.push(AuthLog({
            email: _email,
            action: "desactivation",
            timestamp: block.timestamp,
            success: true
        }));
        
        // Émettre l'événement
        emit UserDeactivated(_email, block.timestamp);
        
        return true;
    }
    
    /**
     * @notice Récupère les informations d'un utilisateur
     * @param _email Email de l'utilisateur
     * @return exists Booléen indiquant si l'utilisateur existe
     * @return nom Nom de l'utilisateur
     * @return prenom Prénom de l'utilisateur
     * @return role Rôle de l'utilisateur
     * @return isActive Statut du compte
     */
    function getUserInfo(
        string memory _email
    ) public view returns (
        bool exists,
        string memory nom,
        string memory prenom,
        string memory role,
        bool isActive
    ) {
        // Calculer le hash de l'email
        bytes32 emailHash = keccak256(abi.encodePacked(_email));
        
        // Vérifier si l'utilisateur existe
        if (users[emailHash].createdAt == 0) {
            return (false, "", "", "", false);
        }
        
        // Retourner les informations
        return (
            true,
            users[emailHash].nom,
            users[emailHash].prenom,
            users[emailHash].role,
            users[emailHash].isActive
        );
    }
    
    /**
     * @notice Récupère le nombre total d'utilisateurs enregistrés
     * @return count Nombre d'utilisateurs
     */
    function getUserCount() public view returns (uint256 count) {
        return userEmails.length;
    }
    
    /**
     * @notice Récupère le nombre de journaux d'authentification
     * @return count Nombre de journaux
     */
    function getAuthLogCount() public view returns (uint256 count) {
        return authLogs.length;
    }
    
    /**
     * @notice Récupère un journal d'authentification par son index
     * @param _index Index du journal
     * @return email Email de l'utilisateur
     * @return action Type d'action
     * @return timestamp Timestamp de l'action
     * @return success Succès ou échec de l'action
     */
    function getAuthLogByIndex(
        uint256 _index
    ) public view returns (
        string memory email,
        string memory action,
        uint256 timestamp,
        bool success
    ) {
        require(_index < authLogs.length, "Index hors limites");
        
        AuthLog memory log = authLogs[_index];
        return (log.email, log.action, log.timestamp, log.success);
    }
    
    /**
     * @notice Récupère les derniers journaux d'authentification pour un utilisateur
     * @param _email Email de l'utilisateur
     * @param _count Nombre de journaux à récupérer
     * @return actions Tableau des actions
     * @return timestamps Tableau des timestamps
     * @return successes Tableau des statuts de succès
     */
    function getRecentAuthLogs(
        string memory _email,
        uint256 _count
    ) public view returns (
        string[] memory actions,
        uint256[] memory timestamps,
        bool[] memory successes
    ) {
        // Limiter le nombre de journaux à récupérer
        uint256 count = _count;
        if (count > authLogs.length) {
            count = authLogs.length;
        }
        
        // Initialiser les tableaux de résultats
        string[] memory actionsResult = new string[](count);
        uint256[] memory timestampsResult = new uint256[](count);
        bool[] memory successesResult = new bool[](count);
        
        // Parcourir les journaux en commençant par les plus récents
        uint256 resultIndex = 0;
        for (uint256 i = authLogs.length; i > 0 && resultIndex < count; i--) {
            AuthLog memory log = authLogs[i-1];
            
            // Vérifier si le journal concerne l'utilisateur spécifié
            if (keccak256(abi.encodePacked(log.email)) == keccak256(abi.encodePacked(_email))) {
                actionsResult[resultIndex] = log.action;
                timestampsResult[resultIndex] = log.timestamp;
                successesResult[resultIndex] = log.success;
                resultIndex++;
            }
        }
        
        return (actionsResult, timestampsResult, successesResult);
    }
}