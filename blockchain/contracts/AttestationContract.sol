// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AttestationContract {
    event ReportValidated(address indexed encadrant, string identifiantRapport, uint timestamp);
    event TimeoutValidated(address indexed tier, string identifiantRapport, uint timestamp);
    event AttestationPublished(
        address indexed issuer,
        string indexed stageIdentifier,
        string reportIdentifier,
        string fileHash,
        uint timestamp
    );

    struct Attestation {
        string fileHash;
        string reportIdentifier;
        address issuer;
        uint timestamp;
        bool exists;
    }

    mapping(string => Attestation) private attestations;
    string[] private identifiers;

    function publishAttestation(
        string calldata stageIdentifier,
        string calldata reportIdentifier,
        string calldata fileHash
    ) external {
        require(bytes(stageIdentifier).length > 0, "Stage ID required");
        require(bytes(reportIdentifier).length > 0, "Report ID required");
        require(bytes(fileHash).length > 0, "Hash required");
        require(!attestations[stageIdentifier].exists, "Already exists");

        attestations[stageIdentifier] = Attestation({
            fileHash: fileHash,
            reportIdentifier: reportIdentifier,
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        identifiers.push(stageIdentifier);
        emit AttestationPublished(msg.sender, stageIdentifier, reportIdentifier, fileHash, block.timestamp);
    }

    function validateReport(string calldata rapportId) external {
        require(bytes(rapportId).length > 0, "Rapport ID required");
        emit ReportValidated(msg.sender, rapportId, block.timestamp);
    }

    function timeoutValidate(string calldata rapportId) external {
        require(bytes(rapportId).length > 0, "Rapport ID required");
        emit TimeoutValidated(msg.sender, rapportId, block.timestamp);
    }

    function getAttestation(string calldata stageIdentifier)
        external view
        returns (string memory fileHash, string memory reportIdentifier, address issuer, uint timestamp)
    {
        require(attestations[stageIdentifier].exists, "Not found");
        Attestation memory a = attestations[stageIdentifier];
        return (a.fileHash, a.reportIdentifier, a.issuer, a.timestamp);
    }

    function exists(string calldata stageIdentifier) external view returns (bool) {
        return attestations[stageIdentifier].exists;
    }
}
