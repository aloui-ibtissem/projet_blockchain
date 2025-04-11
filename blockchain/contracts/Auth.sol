// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Decentralized Authentication and Role Management
/// @notice This contract enables user registration, authentication, and role assignment using off-chain signed messages.
contract Auth {
    using ECDSA for bytes32;

    /// @notice Enum defining user roles
    enum Role {
        None,
        Etudiant,
        EncadrantAcademique,
        EncadrantProfessionnel,
        ResponsableUniversitaire,
        ResponsableEntreprise
    }

    /// @notice Struct representing a user
    struct User {
        bool registered;
        Role role;
        string firstName;
        string lastName;
        string email;
    }

    /// @notice Mapping from Ethereum address to user data
    mapping(address => User) private users;

    /// @notice Events for front-end listening
    event UserRegistered(address indexed userAddr, Role role);
    event RoleChanged(address indexed userAddr, Role newRole);

    /// @notice Registers a new user if their signature is valid and they are not already registered
    /// @param userAddr The Ethereum address of the user
    /// @param role The role to assign to the user
    /// @param firstName The user's first name
    /// @param lastName The user's last name
    /// @param email The user's email address
    /// @param message A unique message (usually contains identifying data)
    /// @param signature The off-chain signature (signed by the user)
    function registerUser(
        address userAddr,
        Role role,
        string memory firstName,
        string memory lastName,
        string memory email,
        string memory message,
        bytes memory signature
    ) public {
        require(!users[userAddr].registered, "Already registered");
        require(role != Role.None, "Invalid role");

        // Compute the hash of the message (e.g., email + name + address)
        bytes32 messageHash = keccak256(abi.encodePacked(message));
        bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(messageHash);

        // Recover the address that signed the message
        address signer = ECDSA.recover(ethSignedHash, signature);

        require(signer == userAddr, "Invalid signature");

        // Register user with provided data
        users[userAddr] = User({
            registered: true,
            role: role,
            firstName: firstName,
            lastName: lastName,
            email: email
        });

        emit UserRegistered(userAddr, role);
    }

    /// @notice Verifies if an address is registered
    /// @param userAddr The user's Ethereum address
    /// @return True if registered, false otherwise
    function isUserRegistered(address userAddr) external view returns (bool) {
        return users[userAddr].registered;
    }

    /// @notice Changes the role of a registered user (admin functionality in future)
    /// @param userAddr The address of the user
    /// @param newRole The new role to assign
    function changeRole(address userAddr, Role newRole) external {
        require(users[userAddr].registered, "User not registered");
        require(newRole != Role.None, "Invalid role");

        users[userAddr].role = newRole;
        emit RoleChanged(userAddr, newRole);
    }

    /// @notice Returns the role of a given user
    /// @param userAddr The user's Ethereum address
    /// @return The user's role as an enum
    function getRole(address userAddr) external view returns (Role) {
        return users[userAddr].role;
    }

    /// @notice Returns public user info (excluding sensitive details)
    /// @param userAddr The user's Ethereum address
    /// @return Registered status, role, and name (not email for privacy)
    function getUserInfo(address userAddr) external view returns (
        bool,
        Role,
        string memory,
        string memory
    ) {
        User memory user = users[userAddr];
        return (user.registered, user.role, user.firstName, user.lastName);
    }
}
