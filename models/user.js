// Importation des modules nécessaires de Sequelize
const { Model, DataTypes } = require('sequelize');
// Importation de la configuration de la base de données
const sequelize = require('../config/db');

// Importation des autres modèles pour définir des relations entre les entités
const Etudiant = require('./Etudiant');
const EncadrantAcademique = require('./EncadrantAcademique');
const EncadrantProfessionnel = require('./EncadrantProfessionnel');
const Universite = require('./Universite');
const Entreprise = require('./Entreprise');

// Définition de la classe User qui héritera de Model de Sequelize
class User extends Model {}

// Initialisation du modèle User avec les attributs et options
User.init({
    // Définition de l'attribut 'id' comme clé primaire avec auto-incrémentation
    id: {
        type: DataTypes.INTEGER, // Définition du type de données pour l'ID (entier)
        autoIncrement: true, // L'ID sera auto-incrémenté
        primaryKey: true, // L'ID sera la clé primaire
    },

    // Définition de l'attribut 'prenom' pour le prénom de l'utilisateur
    prenom: {
        type: DataTypes.STRING, // Type de données chaîne de caractères
        allowNull: true, // Le prénom est optionnel et n'est pas nécessaire pour tous les utilisateurs
    },

    // Définition de l'attribut 'nom' pour le nom de l'utilisateur
    nom: {
        type: DataTypes.STRING, // Type de données chaîne de caractères
        allowNull: false, // Le nom est obligatoire
    },

    // Définition de l'attribut 'email' pour l'email de l'utilisateur
    email: {
        type: DataTypes.STRING, // Type de données chaîne de caractères
        unique: true, // L'email doit être unique
        allowNull: true, // L'email est optionnel pour certains rôles
    },

    // Définition de l'attribut 'password' pour le mot de passe de l'utilisateur
    password: {
        type: DataTypes.STRING, // Type de données chaîne de caractères
        allowNull: false, // Le mot de passe est obligatoire
    },

    // Définition de l'attribut 'role' pour déterminer le rôle de l'utilisateur
    role: {
        type: DataTypes.ENUM('etudiant', 'encadrant_academique', 'encadrant_professionnel', 'universite', 'entreprise'), 
        // L'attribut 'role' est une énumération avec des valeurs spécifiques
        allowNull: false, // Le rôle est obligatoire
    },

    // Définition de l'attribut 'etudiantId' qui est une clé étrangère vers le modèle 'Etudiant'
    etudiantId: {
        type: DataTypes.INTEGER, // Type de données entier pour l'ID de l'étudiant
        allowNull: true, // L'ID de l'étudiant est optionnel, il ne s'applique que pour les utilisateurs de type 'etudiant'
        references: {
            model: Etudiant, // Le modèle lié est 'Etudiant'
            key: 'id', // La clé étrangère fait référence à l'attribut 'id' du modèle 'Etudiant'
        },
    },

    // Définition de l'attribut 'encadrantAcademiqueId' qui est une clé étrangère vers le modèle 'EncadrantAcademique'
    encadrantAcademiqueId: {
        type: DataTypes.INTEGER, // Type de données entier pour l'ID de l'encadrant académique
        allowNull: true, // L'ID de l'encadrant académique est optionnel, il ne s'applique que pour les utilisateurs de type 'encadrant_academique'
        references: {
            model: EncadrantAcademique, // Le modèle lié est 'EncadrantAcademique'
            key: 'id', // La clé étrangère fait référence à l'attribut 'id' du modèle 'EncadrantAcademique'
        },
    },

    // Définition de l'attribut 'encadrantProfessionnelId' qui est une clé étrangère vers le modèle 'EncadrantProfessionnel'
    encadrantProfessionnelId: {
        type: DataTypes.INTEGER, // Type de données entier pour l'ID de l'encadrant professionnel
        allowNull: true, // L'ID de l'encadrant professionnel est optionnel, il ne s'applique que pour les utilisateurs de type 'encadrant_professionnel'
        references: {
            model: EncadrantProfessionnel, // Le modèle lié est 'EncadrantProfessionnel'
            key: 'id', // La clé étrangère fait référence à l'attribut 'id' du modèle 'EncadrantProfessionnel'
        },
    },

    // Définition de l'attribut 'universiteId' qui est une clé étrangère vers le modèle 'Universite'
    universiteId: {
        type: DataTypes.INTEGER, // Type de données entier pour l'ID de l'université
        allowNull: true, // L'ID de l'université est optionnel, il ne s'applique que pour les utilisateurs de type 'universite'
        references: {
            model: Universite, // Le modèle lié est 'Universite'
            key: 'id', // La clé étrangère fait référence à l'attribut 'id' du modèle 'Universite'
        },
    },

    // Définition de l'attribut 'entrepriseId' qui est une clé étrangère vers le modèle 'Entreprise'
    entrepriseId: {
        type: DataTypes.INTEGER, // Type de données entier pour l'ID de l'entreprise
        allowNull: true, // L'ID de l'entreprise est optionnel, il ne s'applique que pour les utilisateurs de type 'entreprise'
        references: {
            model: Entreprise, // Le modèle lié est 'Entreprise'
            key: 'id', // La clé étrangère fait référence à l'attribut 'id' du modèle 'Entreprise'
        },
    },

}, {
    // Options du modèle Sequelize
    sequelize, // Connexion à la base de données (configurée dans '../config/db')
    modelName: 'User', // Nom du modèle
    tableName: 'users', // Nom de la table dans la base de données
    timestamps: true, // Ajout des timestamps (createdAt et updatedAt)
});

// Exportation du modèle 'User' pour pouvoir l'utiliser dans d'autres fichiers
module.exports = User;
