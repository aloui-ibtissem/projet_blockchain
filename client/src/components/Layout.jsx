import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ role, children, notifications = [] }) => {
  return (
    <div className="layout">
      <Sidebar role={role} />
      <div className="main-area">
        <Header title={`Espace ${role}`} notifications={notifications} />
        <main className="main-content">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};
export default Layout;