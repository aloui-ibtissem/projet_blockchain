/**
 * Composant de navigation
 * Barre de navigation principale de l'application
 */

import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

/**
 * Composant de navigation avec options différentes selon l'état d'authentification
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.estAuthentifie - Indique si l'utilisateur est authentifié
 * @param {Object} props.utilisateur - Informations de l'utilisateur connecté
 * @param {Function} props.onDeconnexion - Fonction de déconnexion
 */
const Navigation = ({ estAuthentifie, utilisateur, onDeconnexion }) => {
  const navigate = useNavigate();

  // Obtenir le nom du rôle en fonction de l'ID
  const getNomRole = (roleId) => {
    switch (roleId) {
      case 1:
        return 'Étudiant';
      case 2:
        return 'Encadrant Académique';
      case 3:
        return 'Encadrant Professionnel';
      case 4:
        return 'Responsable Universitaire';
      case 5:
        return 'Responsable Entreprise';
      default:
        return 'Utilisateur';
    }
  };

  // Gérer la déconnexion
  const handleDeconnexion = () => {
    onDeconnexion();
    navigate('/connexion');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">PLATEFORME ACADEMIQUE</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Accueil</Nav.Link>
          </Nav>
          <Nav>
            {estAuthentifie ? (
              <>
                <Navbar.Text className="me-3">
                  <FaUserCircle className="me-1" />
                  {utilisateur.prenom} {utilisateur.nom} ({getNomRole(utilisateur.role)})
                </Navbar.Text>
                <Button variant="outline-light" onClick={handleDeconnexion}>
                  <FaSignOutAlt className="me-1" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/inscription">Inscription</Nav.Link>
                <Nav.Link as={Link} to="/connexion">Connexion</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
