import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Home = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="home-container">
      <h1>Bienvenue </h1>
      <p>Rejoignez-nous !</p>
      <div>
        <button onClick={handleLogin}>Se connecter</button>
        <button onClick={handleRegister}>S'inscrire</button>
      </div>
    </div>
  );
};

export default Home;
