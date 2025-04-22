// src/components/Navigation.js
import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

function Navigation() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/">StageChain</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            {!token && (
              <>
                <Nav.Link as={Link} to="/register">Inscription</Nav.Link>
                <Nav.Link as={Link} to="/login">Connexion</Nav.Link>
              </>
            )}
            {token && (
              <>
                {role === "Etudiant" && <Nav.Link as={Link} to="/etudiant">Mon Espace</Nav.Link>}
                {role === "EncadrantAcademique" && <Nav.Link as={Link} to="/encAca">Mon Espace</Nav.Link>}
                {role === "EncadrantProfessionnel" && <Nav.Link as={Link} to="/encPro">Mon Espace</Nav.Link>}
                {role === "ResponsableUniversite" && <Nav.Link as={Link} to="/respUniv">Mon Espace</Nav.Link>}
                {role === "ResponsableEntreprise" && <Nav.Link as={Link} to="/respEnt">Mon Espace</Nav.Link>}
              </>
            )}
          </Nav>
          {token && (
            <Button variant="outline-danger" onClick={handleLogout}>
              Déconnexion
            </Button>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;
