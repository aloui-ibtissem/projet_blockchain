// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Auth {
    // Déclaration de la structure utilisateur
    struct User {
        string firstName;
        string lastName;
        string email;
        string role;
        bytes32 passwordHash;
    }

    // Mapping pour stocker les utilisateurs avec une clé unique (email)
    mapping(address => User) public users;

    // Déclaration des événements
    event UserRegistered(address indexed userAddress, string email, string role);
    event Authentication(address indexed userAddress, bool isAuthenticated);
    
    // Modificateur pour empêcher l'ajout d'un utilisateur existant
    modifier onlyNewUser(address _userAddress) {
        require(bytes(users[_userAddress].email).length == 0, "User already exists");
        _;
    }

    // Inscription d'un utilisateur avec un mot de passe hashé
    function registerUser(
        address _userAddress, 
        string memory _firstName, 
        string memory _lastName, 
        string memory _email, 
        string memory _role, 
        bytes32 _passwordHash
    ) public onlyNewUser(_userAddress) {
        users[_userAddress] = User({
            firstName: _firstName,
            lastName: _lastName,
            email: _email,
            role: _role,
            passwordHash: _passwordHash
        });

        emit UserRegistered(_userAddress, _email, _role);
    }

    // Authentification d'un utilisateur
    function authenticate(address _userAddress, bytes32 _passwordHash) public returns (bool) {
        require(bytes(users[_userAddress].email).length != 0, "User does not exist");
        
        bool isAuthenticated = users[_userAddress].passwordHash == _passwordHash;
        
        emit Authentication(_userAddress, isAuthenticated);
        return isAuthenticated;
    }

    // Récupération du rôle d'un utilisateur
    function getUserRole(address _userAddress) public view returns (string memory) {
        require(bytes(users[_userAddress].email).length != 0, "User does not exist");
        return users[_userAddress].role;
    }
}
