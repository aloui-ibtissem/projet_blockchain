import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Ici, tu pourrais effacer un token ou une session d'utilisateur avant la déconnexion
    navigate('/'); // Redirection vers la page de connexion
  };

  return (
    <div className="dashboard-container">
      <h2>Bienvenue sur votre tableau de bord</h2>
      <button onClick={handleLogout}>Déconnexion</button>
    </div>
  );
};

export default Dashboard;
