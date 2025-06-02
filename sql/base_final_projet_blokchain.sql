-- Création de la base
CREATE DATABASE IF NOT EXISTS projet_blockchain;

USE projet_blockchain;

-- Table Universite
CREATE TABLE Universite (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL
);

-- Table Entreprise
CREATE TABLE Entreprise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    logoPath VARCHAR(255)
);

-- Table Etudiant
CREATE TABLE Etudiant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(255) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    universiteId INT,
    ethAddress VARCHAR(255) UNIQUE,
    role VARCHAR(255),
    identifiant_unique VARCHAR(255) UNIQUE,
    FOREIGN KEY (universiteId) REFERENCES Universite (id)
);

-- Table EncadrantAcademique
CREATE TABLE EncadrantAcademique (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(255) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    universiteId INT,
    ethAddress VARCHAR(255) UNIQUE,
    role VARCHAR(255),
    identifiant_unique VARCHAR(255) UNIQUE,
    FOREIGN KEY (universiteId) REFERENCES Universite (id)
);

-- Table EncadrantProfessionnel
CREATE TABLE EncadrantProfessionnel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(255) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    entrepriseId INT,
    ethAddress VARCHAR(255) UNIQUE,
    role VARCHAR(255),
    identifiant_unique VARCHAR(255) UNIQUE,
    FOREIGN KEY (entrepriseId) REFERENCES Entreprise (id)
);

-- Table ResponsableUniversitaire
CREATE TABLE ResponsableUniversitaire (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(255) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    universiteId INT,
    ethAddress VARCHAR(255) UNIQUE,
    role VARCHAR(255),
    identifiant_unique VARCHAR(255) UNIQUE,
    FOREIGN KEY (universiteId) REFERENCES Universite (id)
);

-- Table ResponsableEntreprise
CREATE TABLE ResponsableEntreprise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(255) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    entrepriseId INT,
    ethAddress VARCHAR(255) UNIQUE,
    role VARCHAR(255),
    identifiant_unique VARCHAR(255) UNIQUE,
    FOREIGN KEY (entrepriseId) REFERENCES Entreprise (id)
);

-- Table Stage
CREATE TABLE Stage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiantId INT NOT NULL,
    encadrantAcademiqueId INT NOT NULL,
    encadrantProfessionnelId INT NOT NULL,
    entrepriseId INT NOT NULL,
    universiteId INT,
    dateDebut DATE NOT NULL,
    dateFin DATE NOT NULL,
    intervalleValidation INT NOT NULL,
    etat ENUM(
        'en attente',
        'validé',
        'refusé'
    ) DEFAULT 'en attente',
    identifiant_unique VARCHAR(255) UNIQUE,
    titre VARCHAR(255),
    estHistorique BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (etudiantId) REFERENCES Etudiant (id),
    FOREIGN KEY (encadrantAcademiqueId) REFERENCES EncadrantAcademique (id),
    FOREIGN KEY (encadrantProfessionnelId) REFERENCES EncadrantProfessionnel (id),
    FOREIGN KEY (entrepriseId) REFERENCES Entreprise (id),
    FOREIGN KEY (universiteId) REFERENCES Universite (id)
);

-- SujetStage
CREATE TABLE SujetStage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stageId INT,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    encadrantAcademiqueId INT NOT NULL,
    encadrantProfessionnelId INT NOT NULL,
    etudiantId INT NOT NULL,
    status VARCHAR(255) DEFAULT 'en attente',
    aca_validé BOOLEAN DEFAULT FALSE,
    pro_validé BOOLEAN DEFAULT FALSE,
    aca_refusé BOOLEAN DEFAULT FALSE,
    pro_refusé BOOLEAN DEFAULT FALSE,
    dateDebut DATE,
    dateFin DATE,
    FOREIGN KEY (stageId) REFERENCES Stage (id) ON DELETE CASCADE,
    FOREIGN KEY (encadrantAcademiqueId) REFERENCES EncadrantAcademique (id),
    FOREIGN KEY (encadrantProfessionnelId) REFERENCES EncadrantProfessionnel (id),
    FOREIGN KEY (etudiantId) REFERENCES Etudiant (id)
);

-- RapportStage
CREATE TABLE RapportStage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stageId INT UNIQUE NOT NULL,
    etudiantId INT NOT NULL,
    dateSoumission DATE NOT NULL,
    statutAcademique BOOLEAN DEFAULT FALSE,
    statutProfessionnel BOOLEAN DEFAULT FALSE,
    fichier VARCHAR(255),
    tierDebloqueurValid BOOLEAN DEFAULT FALSE,
    attestationGeneree BOOLEAN DEFAULT FALSE,
    identifiantRapport VARCHAR(255),
    fichierHash VARCHAR(255),
    tierIntervenantAcademiqueId INT DEFAULT NULL,
    tierIntervenantProfessionnelId INT DEFAULT NULL,
    FOREIGN KEY (stageId) REFERENCES Stage (id),
    FOREIGN KEY (etudiantId) REFERENCES Etudiant (id)
);

-- EvaluationRapport
CREATE TABLE EvaluationRapport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rapportId INT NOT NULL,
    encadrantId INT NOT NULL,
    typeEncadrant ENUM('academique', 'professionnel') NOT NULL,
    commentaire TEXT,
    validation BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (rapportId) REFERENCES RapportStage (id)
);

-- CommentaireRapport
CREATE TABLE CommentaireRapport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rapportId INT NOT NULL,
    commentaire TEXT NOT NULL,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rapportId) REFERENCES RapportStage (id) ON DELETE CASCADE
);

-- Attestation
CREATE TABLE Attestation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifiant VARCHAR(255) UNIQUE,
    etudiantId INT,
    stageId INT,
    fichierHash VARCHAR(255),
    fileHash VARCHAR(255),
    ipfsUrl TEXT,
    publishedOnChain BOOLEAN DEFAULT FALSE,
    dateCreation DATETIME,
    responsableId INT NOT NULL,
    FOREIGN KEY (etudiantId) REFERENCES Etudiant (id),
    FOREIGN KEY (stageId) REFERENCES Stage (id)
);

-- Notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destinataire_id INT NOT NULL,
    destinataire_type VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    subject VARCHAR(255),
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    est_lu BOOLEAN DEFAULT FALSE
);

-- TokenVerif
CREATE TABLE TokenVerif (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(255),
    nom VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(255),
    signature TEXT,
    token VARCHAR(255),
    utilisé BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    universiteId INT DEFAULT NULL,
    entrepriseId INT DEFAULT NULL,
    structureType VARCHAR(50) DEFAULT NULL
);

-- TierDebloqueur
CREATE TABLE TierDebloqueur (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(255) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    structureType ENUM('universite', 'entreprise') NOT NULL,
    universiteId INT DEFAULT NULL,
    entrepriseId INT DEFAULT NULL,
    ethAddress VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(255),
    FOREIGN KEY (universiteId) REFERENCES Universite (id),
    FOREIGN KEY (entrepriseId) REFERENCES Entreprise (id)
);

-- HistoriqueAction
CREATE TABLE IF NOT EXISTS HistoriqueAction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rapportId INT NULL,
    stageId INT,
    utilisateurId INT NOT NULL,
    role ENUM(
        'Etudiant',
        'EncadrantAcademique',
        'EncadrantProfessionnel',
        'TierDebloqueur',
        'ResponsableEntreprise',
        'ResponsableUniversitaire'
    ) NOT NULL,
    action VARCHAR(255) NOT NULL,
    commentaire TEXT,
    origine ENUM('manuelle', 'automatique') DEFAULT 'manuelle',
    dateAction DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rapportId) REFERENCES RapportStage (id) ON DELETE CASCADE,
    FOREIGN KEY (stageId) REFERENCES Stage (id) ON DELETE CASCADE
);

-- Indexes
ALTER TABLE HistoriqueAction
ADD INDEX idx_rapport_role (rapportId, role);

ALTER TABLE HistoriqueAction
ADD INDEX idx_utilisateur_date (utilisateurId, dateAction);

ALTER TABLE HistoriqueAction
ADD INDEX idx_rapport_origine (rapportId, origine);

-- Table compteur unique stage
CREATE TABLE CompteurStage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    annee VARCHAR(20) NOT NULL,
    entrepriseId INT NOT NULL,
    universiteId INT NOT NULL,
    dernierNumero INT DEFAULT 0,
    UNIQUE (
        annee,
        entrepriseId,
        universiteId
    )
);