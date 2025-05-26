// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaUser, FaSignOutAlt, FaBell } from 'react-icons/fa';
import './styles.css';

const Sidebar = ({ role }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="custom-sidebar">
      <div className="logo">StageChain</div>

      <nav className="nav-links">
        {role === 'Etudiant' && (
          <>
            <NavLink to="/etudiant" activeclassname="active"><FaHome /> Mon Stage</NavLink>
            <NavLink to="/notifications" activeclassname="active"><FaBell /> Notifications</NavLink>
          </>
        )}

        {role === 'EncadrantAcademique' && (
          <>
            <NavLink to="/encAca"><FaHome /> Propositions</NavLink>
          </>
        )}

        {role === 'EncadrantProfessionnel' && (
          <>
            <NavLink to="/encPro"><FaHome /> Évaluations</NavLink>
          </>
        )}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <FaSignOutAlt /> Déconnexion
      </button>
    </div>
  );
};

export default Sidebar;
