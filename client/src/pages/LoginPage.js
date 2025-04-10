import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './AuthPages.css';

/**
 * Page de connexion
 * Permet aux utilisateurs de se connecter avec leur email, mot de passe et rôle
 */
const LoginPage = () => {
  // États pour les champs du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  
  // États pour la gestion des erreurs et du chargement
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [blockchainVerification, setBlockchainVerification] = useState(null);
  
  // Hooks pour la navigation et l'authentification
  const navigate = useNavigate();
  const { login, currentUser, error } = useAuth();
  
  // Rediriger si déjà connecté
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  /**
   * Gère la soumission du formulaire de connexion
   * @param {Event} e - Événement de soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validation des champs
    if (!email || !password || !role) {
      setFormError('Veuillez remplir tous les champs');
      return;
    }
    
    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Veuillez entrer une adresse email valide');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Tentative de connexion
      const result = await login(email, password, role);
      
      if (result.success) {
        // Simuler la vérification blockchain
        setBlockchainVerification({
          status: 'success',
          message: 'Vérification blockchain réussie'
        });
        
        // Rediriger après un court délai pour montrer la vérification blockchain
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setFormError(result.message || 'Échec de la connexion');
        setBlockchainVerification(null);
      }
    } catch (error) {
      setFormError('Une erreur est survenue lors de la connexion');
      setBlockchainVerification(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page login-page">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="auth-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <h2 className="auth-title">Connexion</h2>
                  <p className="auth-subtitle">
                    Accédez à votre espace personnel
                  </p>
                </div>
                
                {/* Affichage des erreurs */}
                {(formError || error) && (
                  <Alert variant="danger">
                    {formError || error}
                  </Alert>
                )}
                
                {/* Affichage de la vérification blockchain */}
                {blockchainVerification && (
                  <Alert 
                    variant={blockchainVerification.status === 'success' ? 'success' : 'danger'}
                    className="blockchain-verification"
                  >
                    <div className="d-flex align-items-center">
                      <div className="blockchain-icon me-3">
                        <i className={`bi ${blockchainVerification.status === 'success' ? 'bi-shield-check' : 'bi-shield-exclamation'}`}></i>
                      </div>
                      <div>
                        <h5 className="mb-1">Sécurité Blockchain</h5>
                        <p className="mb-0">{blockchainVerification.message}</p>
                      </div>
                    </div>
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  {/* Champ Email */}
                  <Form.Group className="mb-3">
                    <Form.Label>Adresse Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Entrez votre adresse email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </Form.Group>
                  
                  {/* Champ Mot de passe */}
                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </Form.Group>
                  
                  {/* Sélection du rôle */}
                  <Form.Group className="mb-4">
                    <Form.Label>Rôle</Form.Label>
                    <Form.Select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      disabled={isLoading}
                      required
                    >
                      <option value="">Sélectionnez votre rôle</option>
                      <option value="etudiant">Étudiant</option>
                      <option value="encadrantAcademique">Encadrant Académique</option>
                      <option value="encadrantProfessionnel">Encadrant Professionnel</option>
                      <option value="responsableUniversitaire">Responsable Universitaire</option>
                      <option value="responsableEntreprise">Responsable Entreprise</option>
                    </Form.Select>
                  </Form.Group>
                  
                  {/* Bouton de soumission */}
                  <div className="d-grid gap-2 mb-4">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Connexion en cours...
                        </>
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                  </div>
                  
                  {/* Lien vers la page d'inscription */}
                  <div className="text-center">
                    <p>
                      Vous n'avez pas de compte ?{' '}
                      <Link to="/inscription" className="auth-link">
                        S'inscrire
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
            
            {/* Section Blockchain */}
            <div className="blockchain-info mt-4">
              <div className="blockchain-badge">
                <i className="bi bi-shield-lock"></i>
                <span>Sécurisé par Blockchain</span>
              </div>
              <p className="text-center text-muted mt-2">
                Cette plateforme utilise la technologie blockchain pour sécuriser votre authentification
                et garantir l'intégrité de vos données.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
