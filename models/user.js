

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Etudiant = require('./Etudiant');
const EncadrantAcademique = require('./EncadrantAcademique');
const EncadrantProfessionnel = require('./EncadrantProfessionnel');
const Universite = require('./Universite');
const Entreprise = require('./Entreprise');

class User extends Model {}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    prenom: {
        type: DataTypes.STRING,
        allowNull: true, // Prenom seulement pour les étudiants et les encadrants
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true, // Email uniquement pour certains rôles
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('etudiant', 'encadrant_academique', 'encadrant_professionnel', 'universite', 'entreprise'),
        allowNull: false,
    },
    etudiantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Etudiant,
            key: 'id',
        },
    },
    encadrantAcademiqueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: EncadrantAcademique,
            key: 'id',
        },
    },
    encadrantProfessionnelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: EncadrantProfessionnel,
            key: 'id',
        },
    },
    universiteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Universite,
            key: 'id',
        },
    },
    entrepriseId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Entreprise,
            key: 'id',
        },
    },
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
});

module.exports = User;
