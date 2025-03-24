import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(''); // Ajout du champ rôle
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!role) {
      setMessage('Veuillez sélectionner un rôle.');
      setIsError(true);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/login', { email, password, role });

      if (response.status === 200) {
        setMessage('Connexion réussie!');
        setIsError(false);

        // Redirection dynamique en fonction du rôle
        switch (role) {
          case 'etudiant':
            navigate('/dashboard/etudiant');
            break;
          case 'universite':
            navigate('/dashboard/universite');
            break;
          case 'entreprise':
            navigate('/dashboard/entreprise');
            break;
          case 'encadrantprofessionnel':
            navigate('/dashboard/encadrant-pro');
            break;
          case 'encadrantacademique':
            navigate('/dashboard/encadrant-acad');
            break;
          case 'tier_debloqueur':
            navigate('/dashboard/tier-debloqueur');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (error) {
      setMessage('Erreur de connexion! Vérifiez vos identifiants.');
      setIsError(true);
    }
  };

  return (
    <div className="auth-container">
      <h2>Connexion</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <button type="submit">Se connecter</button>
      </form>

      {message && (
        <p className={isError ? 'message' : 'success'}>
          {message}
        </p>
      )}

      <p>
        Pas encore de compte ? <a href="/register">S'inscrire</a>
      </p>
    </div>
  );
};

export default Login;
