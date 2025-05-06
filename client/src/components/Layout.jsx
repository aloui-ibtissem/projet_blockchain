import React from "react";
import { Container, Row, Col, Nav, Navbar, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import './Layout.css';

export default function Layout({ children, notifications = [], role }) {
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.est_lu).length;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Container fluid className="p-0">
      <Navbar bg="light" expand="lg" className="shadow-sm px-3">
        <Navbar.Brand as={Link} to="/">MonApp</Navbar.Brand>
        <Navbar.Toggle aria-controls="nav" />
        <Navbar.Collapse id="nav">
          <Nav className="ms-auto">
            <Nav.Link onClick={() => navigate('/notifications')}>
              Notifications <Badge bg="primary">{unreadCount}</Badge>
            </Nav.Link>
            <Nav.Link onClick={handleLogout}>Déconnexion</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Row className="gx-0">
        <Col xs={2} className="bg-white sidebar shadow-sm">
          <Nav className="flex-column mt-4">
            <Nav.Link as={Link} to="/dashboard">Tableau de bord</Nav.Link>
            {role === 'Etudiant' && <Nav.Link as={Link} to="/dashboard/stage">Mon Stage</Nav.Link>}
            {(role === 'EncadrantAcademique') && <Nav.Link as={Link} to="/dashboard/propositions">Propositions</Nav.Link>}
            {/* Ajouter d'autres liens selon role */}
          </Nav>
        </Col>
        <Col xs={10} className="p-4 main-content">
          {children}
        </Col>
      </Row>
    </Container>
  );
}
