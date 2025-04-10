/**
 * Composant Footer
 * Pied de page de l'application
 */

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

/**
 * Pied de page avec informations sur l'application
 */
const Footer = () => {
  return (
    <footer className="bg-light py-4 mt-auto">
      <Container>
        <Row>
          <Col md={6} className="text-center text-md-start">
            <p className="mb-0">&copy; {new Date().getFullYear()} PLATEFORME ACADEMIQUE</p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <p className="mb-0">Sécurisé par la technologie Blockchain</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
