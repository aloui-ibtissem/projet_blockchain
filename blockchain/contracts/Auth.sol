// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Auth {
    enum Role {
        None,
        Etudiant,
        EncadrantAca,
        EncadrantPro,
        ResponsableUni,
        ResponsableEnt,
        TierDebloqueur 
    }

    mapping(address => Role) public roles;

    event UserRegistered(address indexed user, Role role);
    event RoleReset(address indexed user);

    function selfRegister(Role _role) external {
        require(_role != Role.None, "Invalid role");
        require(roles[msg.sender] == Role.None, "Already registered");
        roles[msg.sender] = _role;
        emit UserRegistered(msg.sender, _role);
    }

    function getRole(address user) external view returns (Role) {
        return roles[user];
    }

    function resetRole(address user) external {
        require(msg.sender == user, "Only the user can reset");
        require(roles[user] != Role.None, "Not registered");
        roles[user] = Role.None;
        emit RoleReset(user);
    }
}
