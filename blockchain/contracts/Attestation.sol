// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Attestation {
    address public owner;

    struct AttestationData {
        string studentName;
        string stageId;
        string stageTitle;
        string encadrantAcademique;
        string encadrantProfessionnel;
        uint256 validationDate;
        string fileHash;
    }

    mapping(string => AttestationData) public attestations;

    event AttestationEnregistree(
        string indexed stageId,
        string studentName,
        string fileHash,
        uint256 validationDate
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Seul le responsable entreprise  peut executer cela.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function enregistrerAttestation(
        string memory _studentName,
        string memory _stageId,
        string memory _stageTitle,
        string memory _encadrantAca,
        string memory _encadrantPro,
        string memory _fileHash
    ) external onlyOwner {
        require(bytes(_stageId).length > 0, "Identifiant de stage requis");

        AttestationData memory nouvelle = AttestationData({
            studentName: _studentName,
            stageId: _stageId,
            stageTitle: _stageTitle,
            encadrantAcademique: _encadrantAca,
            encadrantProfessionnel: _encadrantPro,
            validationDate: block.timestamp,
            fileHash: _fileHash
        });

        attestations[_stageId] = nouvelle;

        emit AttestationEnregistree(_stageId, _studentName, _fileHash, block.timestamp);
    }

    function verifierAttestation(string memory _stageId) external view returns (
        string memory, string memory, string memory,
        string memory, string memory, uint256, string memory
    ) {
        AttestationData memory a = attestations[_stageId];
        require(bytes(a.stageId).length > 0, "attestation non trouvee ");
        return (
            a.studentName,
            a.stageId,
            a.stageTitle,
            a.encadrantAcademique,
            a.encadrantProfessionnel,
            a.validationDate,
            a.fileHash
        );
    }
}
