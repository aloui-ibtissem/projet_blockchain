import React from 'react';
import { Container, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

/**
 * Page d'accueil de l'application
 * Présente l'application et permet d'accéder aux pages d'inscription et de connexion
 */
const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Section Hero */}
      <div className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="hero-content">
              <h1 className="hero-title">Plateforme de Gestion des Stages </h1>
              <p className="hero-subtitle">
                Une solution sécurisée par blockchain pour  vous connecter dans un environnement académique fiable.
              </p>
              <div className="hero-buttons">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="me-3"
                  onClick={() => navigate('/connexion')}
                >
                  Se connecter
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="lg"
                  onClick={() => navigate('/inscription')}
                >
                  S'inscrire
                </Button>
              </div>
            </Col>
            <Col lg={6} className="hero-image">
              <Image 
                src="/assets/images/education-hero.svg" 
                alt="Plateforme éducative" 
                fluid 
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Section Fonctionnalités */}
      <div className="features-section">
        <Container>
          <h2 className="section-title text-center mb-5">Fonctionnalités Principales</h2>
          <Row>
            <Col md={4}>
              <Card className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-shield-lock"></i>
                </div>
                <Card.Body>
                  <Card.Title>Authentification Sécurisée</Card.Title>
                  <Card.Text>
                    Système d'authentification renforcé par la technologie blockchain 
                    pour une sécurité et une traçabilité optimales.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-people"></i>
                </div>
                <Card.Body>
                  <Card.Title>Gestion Multi-Acteurs</Card.Title>
                  <Card.Text>
                    Interface adaptée pour chaque type d'utilisateur : étudiants, 
                    encadrants académiques, professionnels et responsables.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card">
                <div className="feature-icon">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <Card.Body>
                  <Card.Title>Suivi des Documents</Card.Title>
                  <Card.Text>
                    Gestion et suivi des rapports de stage, évaluations et documents 
                    administratifs en toute simplicité.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Section Acteurs */}
      <div className="roles-section">
        <Container>
          <h2 className="section-title text-center mb-5">Espace Dédié pour Chaque Acteur</h2>
          <Row>
            <Col lg={6} className="mb-4">
              <Card className="role-card">
                <Row className="g-0">
                  <Col md={4} className="role-icon-container">
                    <div className="role-icon student-icon">
                      <i className="bi bi-mortarboard"></i>
                    </div>
                  </Col>
                  <Col md={8}>
                    <Card.Body>
                      <Card.Title>Étudiants</Card.Title>
                      <Card.Text>
                        Soumettez vos rapports, suivez vos évaluations et communiquez 
                        avec vos encadrants en toute simplicité.
                      </Card.Text>
                    </Card.Body>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className="role-card">
                <Row className="g-0">
                  <Col md={4} className="role-icon-container">
                    <div className="role-icon academic-icon">
                      <i className="bi bi-book"></i>
                    </div>
                  </Col>
                  <Col md={8}>
                    <Card.Body>
                      <Card.Title>Encadrants Académiques</Card.Title>
                      <Card.Text>
                        Suivez les progrès de vos étudiants, évaluez leurs rapports 
                        et coordonnez avec les encadrants professionnels.
                      </Card.Text>
                    </Card.Body>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className="role-card">
                <Row className="g-0">
                  <Col md={4} className="role-icon-container">
                    <div className="role-icon professional-icon">
                      <i className="bi bi-briefcase"></i>
                    </div>
                  </Col>
                  <Col md={8}>
                    <Card.Body>
                      <Card.Title>Encadrants Professionnels</Card.Title>
                      <Card.Text>
                        Évaluez les performances des stagiaires et partagez vos retours 
                        avec l'équipe académique de manière sécurisée.
                      </Card.Text>
                    </Card.Body>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className="role-card">
                <Row className="g-0">
                  <Col md={4} className="role-icon-container">
                    <div className="role-icon admin-icon">
                      <i className="bi bi-building"></i>
                    </div>
                  </Col>
                  <Col md={8}>
                    <Card.Body>
                      <Card.Title>Responsables</Card.Title>
                      <Card.Text>
                        Supervisez l'ensemble du processus de stage, gérez les utilisateurs 
                        et accédez aux statistiques et rapports globaux.
                      </Card.Text>
                    </Card.Body>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Section Blockchain */}
      <div className="blockchain-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={5}>
              <div className="blockchain-image">
                <Image 
                  src="/assets/images/blockchain.svg" 
                  alt="Technologie Blockchain" 
                  fluid 
                />
              </div>
            </Col>
            <Col lg={7}>
              <div className="blockchain-content">
                <h2 className="section-title">Sécurisé par la Blockchain</h2>
                <p className="section-description">
                  Notre plateforme utilise la technologie blockchain pour garantir:
                </p>
                <ul className="blockchain-features">
                  <li>
                    <i className="bi bi-check-circle"></i>
                    <span>Authentification inviolable des utilisateurs</span>
                  </li>
                  <li>
                    <i className="bi bi-check-circle"></i>
                    <span>Traçabilité complète des actions et documents</span>
                  </li>
                  <li>
                    <i className="bi bi-check-circle"></i>
                    <span>Protection contre la falsification des données</span>
                  </li>
                  <li>
                    <i className="bi bi-check-circle"></i>
                    <span>Vérification cryptographique des identités</span>
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Section CTA */}
      <div className="cta-section">
        <Container className="text-center">
          <h2 className="cta-title">Prêt à commencer?</h2>
          <p className="cta-description">
            Rejoignez notre plateforme et profitez d'une gestion de stage simplifiée et sécurisée.
          </p>
          <div className="cta-buttons">
            <Button 
              variant="primary" 
              size="lg" 
              className="me-3"
              onClick={() => navigate('/inscription')}
            >
              Créer un compte
            </Button>
            <Button 
              variant="outline-light" 
              size="lg"
              onClick={() => navigate('/connexion')}
            >
              Se connecter
            </Button>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default HomePage;
