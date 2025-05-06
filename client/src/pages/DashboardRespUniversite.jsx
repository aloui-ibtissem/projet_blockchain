// src/pages/DashboardRespUniversitaire.jsx
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, ListGroup, Alert, Spinner } from 'react-bootstrap';
import './DashboardRespUniversite.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function DashboardRespUniversitaire() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [encadrants, setEncadrants] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== 'ResponsableUniversite') {
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
        `${API_URL}/api/universite/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEncadrants(res.data.encadrants || []);
      setEtudiants(res.data.etudiants || []);
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
      setMessage('Erreur chargement données.');
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
      <h2 className="text-center mb-4">
        Responsable Universitaire
      </h2>
      {message && <Alert variant="danger">{message}</Alert>}

      <Card className="mb-4 shadow-sm">
        <Card.Header>Encadrants Académiques</Card.Header>
        <ListGroup variant="flush">
          {encadrants.length === 0 ? (
            <ListGroup.Item>Aucun encadrant</ListGroup.Item>
          ) : (
            encadrants.map(e => (
              <ListGroup.Item key={e.id}>
                {e.prenom} {e.nom} — {e.email}
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Header>Étudiants Inscrits</Card.Header>
        <ListGroup variant="flush">
          {etudiants.length === 0 ? (
            <ListGroup.Item>Aucun étudiant</ListGroup.Item>
          ) : (
            etudiants.map(e => (
              <ListGroup.Item key={e.id}>
                {e.prenom} {e.nom} — {e.email}
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
    </Container>
  );
}

export default DashboardRespUniversitaire;
