// src/pages/DashboardRespEntreprise.jsx
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Alert, Row, Col, ListGroup, Spinner } from 'react-bootstrap';
import './DashboardRespEntreprise.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function DashboardRespEntreprise() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [stagiaires, setStagiaires] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== 'ResponsableEntreprise') {
      navigate('/login');
      return;
    }
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      navigate('/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/entreprise/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStagiaires(res.data.stagiaires);
      setEmployes(res.data.employes);
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error(err);
      setMessage('Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">Responsable d’Entreprise</h2>
      {message && <Alert variant="danger">{message}</Alert>}

      <Row>
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>Employés Encadrants</Card.Header>
            <ListGroup variant="flush">
              {employes.length === 0 ? (
                <ListGroup.Item>Aucun encadrant</ListGroup.Item>
              ) : (
                employes.map(emp => (
                  <ListGroup.Item key={emp.id}>
                    {emp.prenom} {emp.nom} — {emp.email}
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>

          <Card className="shadow-sm">
            <Card.Header>Notifications</Card.Header>
            <ListGroup variant="flush">
              {notifications.length === 0 ? (
                <ListGroup.Item>Aucune notification</ListGroup.Item>
              ) : (
                notifications.map(n => (
                  <ListGroup.Item key={n.id}>
                    {n.message}{' '}
                    <small className="text-muted">
                      {new Date(n.date_envoi).toLocaleString()}
                    </small>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header>Stagiaires de l’Entreprise</Card.Header>
            <ListGroup variant="flush">
              {stagiaires.length === 0 ? (
                <ListGroup.Item>Aucun stagiaire</ListGroup.Item>
              ) : (
                stagiaires.map(stag => (
                  <ListGroup.Item key={stag.id}>
                    {stag.prenom} {stag.nom} — {stag.email}
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DashboardRespEntreprise;
