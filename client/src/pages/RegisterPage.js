// frontend/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { registerUser } from '../api';

const RegisterPage = () => {
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await registerUser(prenom, nom, email, password, role);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" />
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" />
            <select onChange={(e) => setRole(e.target.value)}>
                <option value="etudiant">Etudiant</option>
                <option value="encadrant_academique">Encadrant académique</option>
                <option value="encadrant_professionnel">Encadrant professionnel</option>
                <option value="universite">Université</option>
                <option value="entreprise">Entreprise</option>
            </select>
            <button type="submit">S'inscrire</button>
        </form>
    );
};

export default RegisterPage;
