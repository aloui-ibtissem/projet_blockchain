// frontend/src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div>
            <h1>Bienvenue sur la plateforme</h1>
            <nav>
                <Link to="/register">S'inscrire</Link>
                <Link to="/login">Se connecter</Link>
            </nav>
        </div>
    );
};

export default HomePage;
