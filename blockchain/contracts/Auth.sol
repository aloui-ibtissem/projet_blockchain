// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Auth {
    struct User {
        string firstName;
        string lastName;
        string role;
        string email;
        bool exists;
        bytes32 passwordHash; // Mot de passe haché
    }

    mapping(address => User) private users;

    event UserRegistered(
        address indexed userAddress,
        string email,
        string role,
        bytes32 passwordHash // Le mot de passe haché
    );
    event PasswordUpdated(address indexed userAddress, bytes32 newPasswordHash);

    // Fonction pour générer un mot de passe aléatoire haché
    function generateRandomPassword() public view returns (bytes32) {
        return keccak256(abi.encodePacked(block.timestamp, msg.sender));
    }

    // Enregistrement d'un utilisateur avec mot de passe généré
    function registerUser(
        string memory _firstName,
        string memory _lastName,
        string memory _role,
        string memory _email
    ) public {
        require(!users[msg.sender].exists, "Utilisateur deja inscrit.");

        bytes32 passwordHash = generateRandomPassword();

        users[msg.sender] = User({
            firstName: _firstName,
            lastName: _lastName,
            role: _role,
            email: _email,
            exists: true,
            passwordHash: passwordHash
        });

        emit UserRegistered(msg.sender, _email, _role, passwordHash);
    }

    // Fonction pour récupérer l'utilisateur et son mot de passe haché
    function getUser(
        address _userAddress
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            bytes32
        )
    {
        require(users[_userAddress].exists, "Utilisateur non inscrit.");
        User memory user = users[_userAddress];
        return (
            user.firstName,
            user.lastName,
            user.role,
            user.email,
            user.passwordHash
        );
    }

    // Fonction pour mettre à jour le mot de passe (haché)
    function updatePassword(string memory newPassword) public {
        require(users[msg.sender].exists, "Utilisateur non inscrit.");
        bytes32 newPasswordHash = keccak256(abi.encodePacked(newPassword));
        users[msg.sender].passwordHash = newPasswordHash;
        emit PasswordUpdated(msg.sender, newPasswordHash);
    }
}
