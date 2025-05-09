// src/pages/DashboardEncadrantPro.jsx
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  Table
} from 'react-bootstrap';
import './DashboardEncadrantAca.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function DashboardEncadrantPro() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [propositions, setPropositions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [commentaire, setCommentaire] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || role !== 'EncadrantProfessionnel') {
      navigate('/login');
      return;
    }
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      navigate('/login');
      return;
    }
    fetchPropositions();
    fetchNotifications();
    fetchRapports();    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPropositions = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/stage/propositions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPropositions(res.data);
    } catch {
      setMessage('Erreur chargement propositions.');
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/stage/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(res.data);
    } catch {
      console.error('Erreur notifications');
    }
  };

  const fetchRapports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/rapport/encadrant`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRapports(res.data);
    } catch (err) {
      console.error("Erreur récupération rapports à valider :", err);
    }
  };
  

  const commenterRapport = async id => {
    if (!commentaire.trim()) {
      alert('Commentaire vide');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/rapport/comment`,
        { rapportId: id, commentaire },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Commentaire envoyé.');
      setCommentaire('');
      fetchRapports();
    } catch {
      setMessage("Erreur envoi commentaire.");
    }
  };

  const validerRaport = async id => {
    try {
      await axios.post(
        `${API_URL}/api/rapport/valider`,
        { rapportId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Rapport validé.');
      fetchRapports();
    } catch {
      setMessage('Erreur validation.');
    }
  };

  const handleDecision = async (id, action) => {
    try {
      const commentaireRej =
        action === 'rejeter'
          ? prompt('Motif du refus (facultatif) :') || ''
          : '';
      await axios.post(
        `${API_URL}/api/stage/valider`,
        {
          sujetId: id,
          action,
          commentaire: commentaireRej
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(
        `Sujet ${action === 'accepter' ? 'accepté' : 'refusé'}.`
      );
      fetchPropositions();
    } catch {
      setMessage('Erreur action sujet.');
    }
  };

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">
        Encadrant Professionnel
      </h2>
      {message && <Alert variant="info">{message}</Alert>}

      <Row>
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>Notifications</Card.Header>
            <Card.Body style={{ maxHeight: 200, overflowY: 'auto' }}>
              {notifications.length ? (
                <ul className="list-unstyled mb-0">
                  {notifications.map(n => (
                    <li key={n.id} className="mb-2">
                      {n.message} <br />
                      <small className="text-muted">
                        {new Date(n.date_envoi).toLocaleDateString()}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">
                  Aucune notification
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>Propositions de Stage</Card.Header>
            <Card.Body>
              {propositions.length === 0 ? (
                <p className="text-muted">
                  Aucune proposition en attente.
                </p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Étudiant</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propositions.map(p => (
                      <tr key={p.id}>
                        <td>{p.titre}</td>
                        <td>{p.etudiantNomComplet}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              handleDecision(p.id, 'accepter')
                            }
                          >
                            Accepter
                          </Button>{' '}
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              handleDecision(p.id, 'rejeter')
                            }
                          >
                            Rejeter
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header>Rapports à Examiner</Card.Header>
            <Card.Body>
              {rapports.length === 0 ? (
                <p className="text-muted">
                  Aucun rapport à valider.
                </p>
              ) : (
                rapports.map(r => (
                  <Card key={r.id} className="mb-3">
                    <Card.Body>
                      <strong>
                        {r.prenomEtudiant} {r.nomEtudiant}
                      </strong>{' '}
                      –{' '}
                      <a
href={`${API_URL}/uploads/${r.fichier}`}
target="_blank"
  rel="noreferrer"
>
  Voir le rapport
</a>

                      <Form.Control
                        as="textarea"
                        rows={2}
                        className="mt-2"
                        placeholder="Ajouter un commentaire..."
                        value={commentaire}
                        onChange={e =>
                          setCommentaire(e.target.value)
                        }
                      />
                      <div className="mt-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            commenterRapport(r.id)
                          }
                        >
                          Commenter
                        </Button>{' '}
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => validerRaport(r.id)}
                        >
                          Valider
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DashboardEncadrantPro;
