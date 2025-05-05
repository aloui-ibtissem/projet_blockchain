// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AttestationContract {
    struct Attestation {
        string identifiant;
        string hashIPFS;
        string etudiantIdentifiant;
        uint256 timestamp;
        address emetteur;
    }

    mapping(string => Attestation) public attestations;
    event AttestationPubliee(string identifiant, string hashIPFS, string etudiantIdentifiant, address emetteur);

    function publierAttestation(string memory identifiant, string memory hashIPFS, string memory etudiantIdentifiant) public {
        require(bytes(attestations[identifiant].hashIPFS).length == 0, "Attestation existe deja");
        attestations[identifiant] = Attestation(identifiant, hashIPFS, etudiantIdentifiant, block.timestamp, msg.sender);
        emit AttestationPubliee(identifiant, hashIPFS, etudiantIdentifiant, msg.sender);
    }

    function getAttestation(string memory identifiant) public view returns (string memory, string memory, string memory, uint256, address) {
        Attestation memory a = attestations[identifiant];
        return (a.identifiant, a.hashIPFS, a.etudiantIdentifiant, a.timestamp, a.emetteur);
    }
}
