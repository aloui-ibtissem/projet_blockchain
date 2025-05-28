import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaHome, FaBell, FaSignOutAlt } from 'react-icons/fa';
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
            <NavLink to="/etudiant" className={({ isActive }) => isActive ? 'active' : ''}><FaHome /> Mon Stage</NavLink>
            <NavLink to="/notifications" className={({ isActive }) => isActive ? 'active' : ''}><FaBell /> Notifications</NavLink>
          </>
        )}

        {role === 'EncadrantAcademique' && (
          <NavLink to="/encAca" className={({ isActive }) => isActive ? 'active' : ''}><FaHome /> Propositions</NavLink>
        )}

        {role === 'EncadrantProfessionnel' && (
          <NavLink to="/encPro" className={({ isActive }) => isActive ? 'active' : ''}><FaHome /> Évaluations</NavLink>
        )}

        {role === 'ResponsableUniversitaire' && (
          <NavLink to="/respUniv" className={({ isActive }) => isActive ? 'active' : ''}><FaHome /> Attestations</NavLink>
        )}

        {role === 'ResponsableEntreprise' && (
          <NavLink to="/respEnt" className={({ isActive }) => isActive ? 'active' : ''}><FaHome /> Stagiaires</NavLink>
        )}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <FaSignOutAlt /> Déconnexion
      </button>
    </div>
  );
};

export default Sidebar;