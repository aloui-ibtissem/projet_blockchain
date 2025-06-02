-- Données de test pour projet_blockchain

-- TierDebloqueur
INSERT INTO
    TierDebloqueur (
        id,
        prenom,
        nom,
        email,
        structureType,
        universiteId,
        entrepriseId,
        ethAddress,
        role
    )
VALUES (
        2,
        'Mohamed',
        'benAli',
        'mhmdalialou1@gmail.com',
        'universite',
        1,
        NULL,
        '0x9C6102054Fcab569408D5212DdFbAFe2d23b7674',
        'TierDebloqueur'
    ),
    (
        3,
        'Aya',
        'Ayachi',
        'ayaayachi673@gmail.com',
        'entreprise',
        NULL,
        1,
        '0xdCA56B385a81B9015A4a71d10dF98f9D85a75fF4',
        'TierDebloqueur'
    );

-- ResponsableEntreprise
INSERT INTO
    ResponsableEntreprise (
        id,
        prenom,
        nom,
        email,
        entrepriseId,
        ethAddress,
        role,
        identifiant_unique
    )
VALUES (
        2,
        'ali',
        'ali',
        'alouimohamedali325@gmail.com',
        1,
        '0x37d80F9aFd09b2de59d6628d109cf5b7a6ACB49f',
        'ResponsableEntreprise',
        'RESPONSABLEENTREPRISE_RGHT_001'
    );

-- Etudiant
INSERT INTO
    Etudiant (
        id,
        prenom,
        nom,
        email,
        universiteId,
        ethAddress,
        role,
        identifiant_unique
    )
VALUES (
        8,
        'Nour',
        'Benahmed',
        'benahmednour140@gmail.com',
        2,
        '0x2706d8f0665932c30D0Acb6384FE7245480884A4',
        'Etudiant',
        'ETUDIANT_ENIT_001'
    ),
    (
        11,
        'jihen',
        'mayoufi',
        'jihenmayoufi29@gmail.com',
        1,
        '0xeB116F3006cf443150F4c371A1eD26e4ac15B64f',
        'Etudiant',
        'ETUDIANT_ENIG_003'
    );

-- ResponsableUniversitaire
INSERT INTO
    ResponsableUniversitaire (
        id,
        prenom,
        nom,
        email,
        universiteId,
        ethAddress,
        role,
        identifiant_unique
    )
VALUES (
        1,
        'Joud',
        'Ayachi',
        'joudayachi08@gmail.com',
        1,
        '0x6f9C2F22367b6C76Fbd53d05059EB4C3123969bA',
        'ResponsableUniversitaire',
        'RESPONSABLEUNIVERSITAIRE_ENIG_001'
    );

-- EncadrantAcademique
INSERT INTO
    EncadrantAcademique (
        id,
        prenom,
        nom,
        email,
        universiteId,
        ethAddress,
        role,
        identifiant_unique
    )
VALUES (
        4,
        'salim',
        'ayachi',
        'alouisalsabil14@gmail.com',
        1,
        '0x64553c65898a5534eC092D6460F3A584c5FeCE10',
        'EncadrantAcademique',
        'ENCADRANTACADEMIQUE_ENIG_001'
    );

-- EncadrantProfessionnel
INSERT INTO
    EncadrantProfessionnel (
        id,
        prenom,
        nom,
        email,
        entrepriseId,
        ethAddress,
        role,
        identifiant_unique
    )
VALUES (
        4,
        'fatma',
        'mhri',
        'alouifatma777@gmail.com',
        1,
        '0x050f711d295a66d01399ce05d06b4279265B635e',
        'EncadrantProfessionnel',
        'ENCADRANTPROFESSIONNEL_RGHT_001'
    );