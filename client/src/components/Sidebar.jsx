import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';
import './styles.css';

const Sidebar = ({ role }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const links = {
    Etudiant: { path: '/etudiant', label: 'Mon Stage' },
    EncadrantAcademique: { path: '/encAca', label: 'Propositions' },
    EncadrantProfessionnel: { path: '/encPro', label: 'Évaluations' },
    ResponsableUniversitaire: { path: '/respUniv', label: 'Attestations' },
    ResponsableEntreprise: { path: '/respEnt', label: 'Stagiaires' }
  };

  const currentLink = links[role];

  return (
    <div className="custom-sidebar">
      <div className="logo">StageChain</div>

      <nav className="nav-links">
        {currentLink && (
          <NavLink
            to={currentLink.path}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <FaHome className="me-2" />
            {currentLink.label}
          </NavLink>
        )}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <FaSignOutAlt className="me-2" /> Déconnexion
      </button>
    </div>
  );
};

export default Sidebar;
