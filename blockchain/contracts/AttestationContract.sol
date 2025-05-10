// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AttestationContract {
    
    // Structure de données d'une attestation
    struct Attestation {
        string attestationId;   // identifiant unique de l'attestation ( comme :  ATT_2024_ENIG_001)
        string stageId;         // identifiant du stage (public)
        string reportId;        // identifiant du rapport
        string fileHash;        // hash SHA256 du fichier PDF
        address issuer;         // adresse de celui qui publie l'attestation
        uint timestamp;         // date de publication
        bool exists;            // flag pour vérification
    }

    // Mapping des attestations publiées, clé = attestationId
    mapping(string => Attestation) private attestations;

    // Evenement : validation d'un encadrant (role = "ACA" ou "PRO")
    event EncadrantValidated(
        address indexed encadrant,
        string indexed rapportId,
        string role,
        uint timestamp
    );

    // Evenement : validation par un tier debloqueur (entite = "universite" ou "entreprise")
    event TierValidated(
        address indexed tier,
        string indexed rapportId,
        string entite,
        uint timestamp
    );

    // Evenement : double validation detectee (les deux validations effectuees)
    event DoubleValidated(
        string indexed rapportId,
        address confirmer,
        uint timestamp
    );

    // Evenement : publication d'une attestation
    event AttestationPublished(
        string indexed attestationId,
        string indexed stageId,
        string reportId,
        string fileHash,
        address indexed issuer,
        uint timestamp
    );

    /**
     * Enregistrer la validation d'un encadrant (academique ou professionnel)
     * L'identifiant du rapport et le role doivent etre specifies
     */
    function validateAsEncadrant(string calldata rapportId, string calldata role) external {
        require(bytes(rapportId).length > 0, "Rapport ID requis");
        require(
            keccak256(bytes(role)) == keccak256("ACA") || keccak256(bytes(role)) == keccak256("PRO"),
            "Role non valide"
        );
        emit EncadrantValidated(msg.sender, rapportId, role, block.timestamp);
    }

    /**
     * Enregistrer la validation par un tier debloqueur (en cas de delai depasse)
     * Entite = "universite" ou "entreprise"
     */
    function validateAsTier(string calldata rapportId, string calldata entite) external {
        require(bytes(rapportId).length > 0, "Rapport ID requis");
        require(
            keccak256(bytes(entite)) == keccak256("universite") || keccak256(bytes(entite)) == keccak256("entreprise"),
            "Entite non valide"
        );
        emit TierValidated(msg.sender, rapportId, entite, block.timestamp);
    }

    /**
     * Enregistrer la double validation effective d'un rapport (les deux encadrants ont valide)
     * Peut etre appele par le backend apres detection
     */
    function confirmDoubleValidation(string calldata rapportId) external {
        require(bytes(rapportId).length > 0, "Rapport ID requis");
        emit DoubleValidated(rapportId, msg.sender, block.timestamp);
    }

    /**
     * Publier une attestation officielle liee a un stage et un rapport
     * Cette publication est unique par identifiant
     */
    function publishAttestation(
        string calldata attestationId,
        string calldata stageId,
        string calldata reportId,
        string calldata fileHash
    ) external {
        require(bytes(attestationId).length > 0, "Attestation ID requis");
        require(bytes(stageId).length > 0, "Stage ID requis");
        require(bytes(reportId).length > 0, "Rapport ID requis");
        require(bytes(fileHash).length > 0, "Hash du fichier requis");
        require(!attestations[attestationId].exists, "Attestation deja existante");

        attestations[attestationId] = Attestation({
            attestationId: attestationId,
            stageId: stageId,
            reportId: reportId,
            fileHash: fileHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit AttestationPublished(attestationId, stageId, reportId, fileHash, msg.sender, block.timestamp);
    }

    /**
     * Recuperer les donnees d'une attestation en fonction de son identifiant
     * Utilise pour la verification publique ou sur le front
     */
    function getAttestation(string calldata attestationId)
        external
        view
        returns (
            string memory stageId,
            string memory reportId,
            string memory fileHash,
            address issuer,
            uint timestamp
        )
    {
        require(attestations[attestationId].exists, "Attestation non trouvee");
        Attestation memory a = attestations[attestationId];
        return (a.stageId, a.reportId, a.fileHash, a.issuer, a.timestamp);
    }

    /**
     * Verifier si une attestation existe via son identifiant
     * Retourne true si elle est enregistree
     */
    function exists(string calldata attestationId) external view returns (bool) {
        return attestations[attestationId].exists;
    }
}
