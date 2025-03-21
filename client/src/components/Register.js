import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false); 
  const navigate = useNavigate();

  // Gérer l'enregistrement de l'utilisateur
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !role || !email) {
      setMessage('Tous les champs sont obligatoires!');
      setIsError(true);
      return;
    }

    try {
      // Appel au backend pour enregistrer l'utilisateur
      const response = await axios.post('http://localhost:3000/register', {
        firstName,
        lastName,
        role,
        email
      });

      if (response.status === 200) {
        setMessage('Inscription réussie! Un mot de passe vous a été envoyé.');
        setIsError(false); // Réinitialiser l'état d'erreur
        navigate('/'); // Rediriger après une inscription réussie
      }
    } catch (error) {
      setMessage('Erreur lors de l\'inscription!');
      setIsError(true); // Afficher une erreur en cas de problème
    }
  };

  return (
    <div className="auth-container">
      <h2>Inscription</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Nom</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Prénom</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="">Sélectionner un rôle</option>
            <option value="etudiant">Étudiant</option>
            <option value="universite">Université</option>
            <option value="entreprise">Entreprise</option>
            <option value="encadrantprofessionnel">Encadrant professionnel</option>
            <option value="encadrantacademique">Encadrant académique</option>
            <option value="tier_debloqueur">Tier Débloqueur</option>
          </select>
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">S'inscrire</button>
      </form>

      {message && (
        <p className={isError ? 'message' : 'success'}>
          {message}
        </p>
      )}

      <p>
        Déjà un compte ? <a href="/login">Se connecter</a>
      </p>
    </div>
  );
};

export default Register;
