/**
 * Page d'inscription
 * Permet aux utilisateurs de s'inscrire à l'application
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { inscription } from '../api';

/**
 * Schéma de validation du formulaire d'inscription
 */
const schemaValidation = Yup.object().shape({
  nom: Yup.string()
    .required('Le nom est obligatoire')
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: Yup.string()
    .required('Le prénom est obligatoire')
    .min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: Yup.string()
    .email('Adresse email invalide')
    .required('L\'email est obligatoire'),
  role: Yup.number()
    .required('Le rôle est obligatoire')
    .min(1, 'Veuillez sélectionner un rôle')
    .max(5, 'Rôle invalide')
});

/**
 * Composant de la page d'inscription
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const [erreur, setErreur] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Gère la soumission du formulaire d'inscription
   * @param {Object} values - Valeurs du formulaire
   * @param {Object} actions - Actions Formik
   */
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoading(true);
      setErreur('');
      setSuccess('');
      
      // Appel à l'API d'inscription
      const response = await inscription(values);
      
      if (response.success) {
        setSuccess('Inscription réussie ! Un mot de passe a été envoyé à votre adresse email. Vous allez être redirigé vers la page de connexion.');
        resetForm();
        
        // Rediriger vers la page de connexion après 5 secondes
        setTimeout(() => {
          navigate('/connexion');
        }, 5000);
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setErreur(error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h2>Inscription</h2>
            </Card.Header>
            <Card.Body className="p-4">
              {erreur && <Alert variant="danger">{erreur}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Formik
                initialValues={{
                  nom: '',
                  prenom: '',
                  email: '',
                  role: ''
                }}
                validationSchema={schemaValidation}
                onSubmit={handleSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nom</Form.Label>
                      <Form.Control
                        type="text"
                        name="nom"
                        value={values.nom}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.nom && errors.nom}
                        placeholder="Entrez votre nom"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.nom}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Prénom</Form.Label>
                      <Form.Control
                        type="text"
                        name="prenom"
                        value={values.prenom}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.prenom && errors.prenom}
                        placeholder="Entrez votre prénom"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.prenom}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Adresse Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && errors.email}
                        placeholder="Entrez votre adresse email"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Rôle</Form.Label>
                      <Form.Select
                        name="role"
                        value={values.role}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.role && errors.role}
                      >
                        <option value="">Sélectionnez votre rôle</option>
                        <option value="1">Étudiant</option>
                        <option value="2">Encadrant Académique</option>
                        <option value="3">Encadrant Professionnel</option>
                        <option value="4">Responsable Universitaire</option>
                        <option value="5">Responsable Entreprise</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.role}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <div className="d-grid">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isSubmitting || loading || success}
                        className="py-2"
                      >
                        {loading ? 'Inscription en cours...' : 'S\'inscrire'}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
              
              <div className="text-center mt-4">
                <p>
                  Vous avez déjà un compte ?{' '}
                  <Button variant="link" onClick={() => navigate('/connexion')} className="p-0">
                    Se connecter
                  </Button>
                </p>
              </div>
              
              <Alert variant="info" className="mt-3">
                <small>
                  <strong>Note:</strong> Pour vous inscrire, vos informations (nom, prénom, email et rôle) 
                  doivent correspondre à celles déjà enregistrées dans notre base de données. 
                  Si l'inscription réussit, un mot de passe sera généré et envoyé à votre adresse email.
                </small>
              </Alert>
            </Card.Body>
            <Card.Footer className="text-center text-muted py-3">
              <small>Sécurisé par la technologie Blockchain</small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
