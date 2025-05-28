import React from 'react';
import './Header.css';

function Header({ title, children }) {
  return (
    <div className="custom-header">
      <h1>{title}</h1>
      <div className="header-actions">
        {children}
      </div>
    </div>
  );
}

export default Header;
