// src/components/Layout.jsx
import React from "react";
import { Container, Row, Col, Nav, Navbar, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import Footer from "./Footer";
import './Layout.css';

export default function Layout({ children, notifications = [], role }) {
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.est_lu).length;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="layout-container d-flex">
      {/* Sidebar Fixe à gauche */}
      <div className="custom-sidebar">
        <div className="sidebar-header">StageChain</div>
        <Nav className="flex-column">
          <Nav.Link as={Link} to="/">Accueil</Nav.Link>
          {role === 'Etudiant' && <Nav.Link as={Link} to="/etudiant">Mon Stage</Nav.Link>}
          {role === 'EncadrantAcademique' && <Nav.Link as={Link} to="/encAca">Propositions</Nav.Link>}
          {role === 'EncadrantProfessionnel' && <Nav.Link as={Link} to="/encPro">Évaluations</Nav.Link>}
          <Nav.Link as={Link} to="/notifications">Notifications <Badge bg="primary">{unreadCount}</Badge></Nav.Link>
          <Nav.Link onClick={handleLogout}>Déconnexion</Nav.Link>
        </Nav>
      </div>

      {/* Contenu Principal */}
      <div className="layout-content flex-grow-1">
        <Navbar bg="light" expand="lg" className="shadow-sm px-4 mb-3">
          <Navbar.Brand>Bienvenue, {role}</Navbar.Brand>
        </Navbar>
        <Container fluid className="p-4">
          {children}
        </Container>
        <Footer />
      </div>
    </div>
  );
}
