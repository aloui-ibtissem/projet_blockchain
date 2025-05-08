import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Alert,
  Spinner,
  Form
} from 'react-bootstrap';
import './DashboardEncadrantAca.css';

const API_URL ="http://localhost:3000";

function DashboardEncadrantAca() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [propositions, setPropositions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [commentaire, setCommentaire] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== 'EncadrantAcademique') {
      navigate('/login');
      return;
    }
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      navigate('/login');
      return;
    }
    loadData();
    fetchRapports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [propRes, notifRes, rapRes] = await Promise.all([
        axios.get(`${API_URL}/api/stage/propositions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/stage/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/rapport/encadrant`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setPropositions(propRes.data);
      setNotifications(notifRes.data);
      setRapports(rapRes.data);
    } catch (err) {
      console.error(err);
      setMessage('Erreur de chargement du dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const commenterRapport = async (rapportId) => {
    if (!commentaire.trim()) return;
    try {
      await axios.post(`${API_URL}/api/rapport/comment`, {
        rapportId,
        commentaire
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Commentaire envoyé.');
      setCommentaire('');
      loadData();
    } catch {
      setMessage("Échec de l'envoi du commentaire.");
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
  

  const validerRapport = async (rapportId) => {
    try {
      await axios.post(`${API_URL}/api/rapport/valider`, {
        rapportId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Rapport validé.');
      loadData();
    } catch {
      setMessage('Échec de la validation.');
    }
  };

  const handleDecision = async (id, action) => {
    try {
      await axios.post(`${API_URL}/api/stage/valider`, {
        sujetId: id,
        action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Sujet ${action === 'accepter' ? 'accepté' : 'refusé'}.`);
      loadData();
    } catch {
      setMessage("Erreur lors du traitement de la proposition.");
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
      <Row>
        <Col>
          <h2 className="text-center">Tableau de bord - Encadrant Académique</h2>
          {message && <Alert variant="info">{message}</Alert>}
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Header>Notifications</Card.Header>
            <Card.Body style={{ maxHeight: 250, overflowY: 'auto' }}>
              {notifications.length ? (
                <ul className="list-unstyled mb-0">
                  {notifications.map((n) => (
                    <li key={n.id} className="mb-2">
                      {n.message}
                      <br />
                      <small className="text-muted">
                        {new Date(n.date_envoi).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">Aucune notification</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header>Propositions de Stage</Card.Header>
            <Card.Body>
              {propositions.length === 0 ? (
                <p className="text-muted">Aucune proposition en attente.</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Dates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propositions.map((p) => (
                      <tr key={p.id}>
                        <td>{p.titre}</td>
                        <td>
                          Du {new Date(p.dateDebut).toLocaleDateString()} au{" "}
                          {new Date(p.dateFin).toLocaleDateString()}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="success"
                            className="me-2"
                            onClick={() => handleDecision(p.id, 'accepter')}
                          >
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDecision(p.id, 'rejeter')}
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
            <Card.Header>Rapports à Valider</Card.Header>
            <Card.Body>
              {rapports.length === 0 ? (
                <p className="text-muted">Aucun rapport à examiner.</p>
              ) : (
                rapports.map((r) => (
                  <Card key={r.id} className="mb-3">
                    <Card.Body>
                      <strong>
                        {r.prenomEtudiant} {r.nomEtudiant}
                      </strong>
                      <br />
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
                        placeholder="Votre commentaire"
                        value={commentaire}
                        className="mt-2"
                        onChange={(e) => setCommentaire(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2 me-2"
                        onClick={() => commenterRapport(r.id)}
                      >
                        Commenter
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        className="mt-2"
                        onClick={() => validerRapport(r.id)}
                      >
                        Valider
                      </Button>
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

export default DashboardEncadrantAca;
