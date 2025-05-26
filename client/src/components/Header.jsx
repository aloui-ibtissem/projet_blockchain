import React from 'react';
import { FaSearch, FaBell } from 'react-icons/fa';
import './styles.css';

function Header({ title }) {
  return (
    <header className="dashboard-header">
      <h2>{title}</h2>
      <div className="header-actions">
        <FaSearch className="icon" />
        <FaBell className="icon" />
        <img src="/profile-pic.jpg" alt="Profil" className="profile-pic" />
      </div>
    </header>
  );
}

export default Header;
