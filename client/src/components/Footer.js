// src/components/Footer.js
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => (
  <footer className="bg-light py-3 text-center">
    <Container>
      <Row>
        <Col>
          <small className="text-muted">&copy; {new Date().getFullYear()} PLATEFORME ACADEMIQUE - Blockchain secured</small>
        </Col>
      </Row>
    </Container>
  </footer>
);

export default Footer;
