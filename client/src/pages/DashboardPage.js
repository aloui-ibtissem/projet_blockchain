// frontend/src/pages/DashboardPage.js
import React from 'react';

const DashboardPage = ({ role }) => {
    return (
        <div>
            <h1>Tableau de bord</h1>
            {role === 'etudiant' && <p>Bienvenue étudiant!</p>}
            {role === 'encadrant_academique' && <p>Bienvenue encadrant académique!</p>}
            {role === 'encadrant_professionnel' && <p>Bienvenue encadrant professionnel!</p>}
            {role === 'universite' && <p>Bienvenue administrateur universitaire!</p>}
            {role === 'entreprise' && <p>Bienvenue administrateur entreprise!</p>}
        </div>
    );
};

export default DashboardPage;
