import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Row, Col, Card, Button, Form, Alert, Spinner, Table, ListGroup, Collapse, Badge
} from 'react-bootstrap';
import './DashboardEncadrantAca.css';

const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
const API_URL = BASE.includes('/api') ? BASE : `${BASE}/api`;

function DashboardEncadrantPro() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [propositions, setPropositions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [commentaires, setCommentaires] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [historique, setHistorique] = useState([]);
  const [rapportsHistoriques, setRapportsHistoriques] = useState([]);
  const [stagiaires, setStagiaires] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (!token || role !== 'EncadrantProfessionnel') return navigate('/login');
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      return navigate('/login');
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [propRes, notifRes, rapRes, histRes, rapHistRes, stagiairesRes] = await Promise.all([
        axios.get(`${API_URL}/stage/propositions`, { headers }),
        axios.get(`${API_URL}/notifications/mes`, { headers }),
        axios.get(`${API_URL}/rapport/encadrant`, { headers }),
        axios.get(`${API_URL}/historique/mes`, { headers }),
        axios.get(`${API_URL}/rapport/encadrant/historique`, { headers }),
        axios.get(`${API_URL}/stage/encadrant/stagiaires`, { headers }),
      ]);
      setPropositions(propRes.data || []);
      setNotifications(notifRes.data || []);
      setRapports(rapRes.data?.enAttente || []);
      setHistorique(histRes.data || []);
      setRapportsHistoriques(rapHistRes.data || []);
      setStagiaires(stagiairesRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id, action) => {
    try {
      await axios.post(`${API_URL}/stage/valider`, { sujetId: id, action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Sujet ${action === 'accepter' ? 'accepté' : 'refusé'}.`);
    } catch {
      setMessage("Erreur lors de l'action sur la proposition.");
    } finally {
      setCommentaires({});
      await loadData();
    }
  };

  const validerRapport = async (id) => {
    try {
      await axios.post(`${API_URL}/rapport/valider`, { rapportId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Rapport validé.");
    } catch {
      setMessage("Erreur lors de la validation.");
    } finally {
      await loadData();
    }
  };

  const commenterRapport = async (id) => {
    const texte = commentaires[id];
    if (!texte?.trim()) return;
    try {
      await axios.post(`${API_URL}/rapport/comment`, { rapportId: id, commentaire: texte }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommentaires(prev => ({ ...prev, [id]: '' }));
      setMessage("Commentaire ajouté.");
      await loadData();
    } catch {
      setMessage("Erreur lors de l'ajout du commentaire.");
    }
  };

  const handleCommentChange = (id, value) => {
    setCommentaires(prev => ({ ...prev, [id]: value }));
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-4 dashboard-etudiant">
      <h2 className="text-center mb-4">Tableau de Bord Encadrant Professionnel</h2>
      {message && <Alert variant="info">{message}</Alert>}

      {/* Notifications */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          Notifications <Badge bg="secondary">{notifications.length}</Badge>
          <Button size="sm" variant="outline-primary" onClick={() => setShowNotif(!showNotif)}>
            {showNotif ? "Masquer" : "Afficher"}
          </Button>
        </Card.Header>
        <Collapse in={showNotif}>
          <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              <ul className="notification-list">
                {notifications.map(n => (
                  <li key={n.id}>
                    <strong>{n.message}</strong>
                    <small className="text-muted"> ({new Date(n.date_envoi).toLocaleDateString()})</small>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted">Aucune notification.</p>}
          </Card.Body>
        </Collapse>
      </Card>

      {/* Propositions */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Propositions de Stage</Card.Header>
        <Card.Body>
          {propositions.length === 0 ? <p>Aucune proposition.</p> : (
            <Table bordered responsive hover>
              <thead>
                <tr><th>Titre</th><th>Dates</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {propositions.map(p => (
                  <tr key={p.id}>
                    <td>{p.titre}</td>
                    <td>{new Date(p.dateDebut).toLocaleDateString()} - {new Date(p.dateFin).toLocaleDateString()}</td>
                    <td>
                      <Button size="sm" variant="success" className="me-2" onClick={() => handleDecision(p.id, 'accepter')}>Accepter</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDecision(p.id, 'rejeter')}>Refuser</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Rapports à valider */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Rapports à Valider</Card.Header>
        <Card.Body>
          {rapports.length === 0 ? (
            <p>Aucun rapport en attente.</p>
          ) : (
            rapports.map(r => (
              <Card key={r.id} className="mb-3 shadow-sm">
                <Card.Body>
                  <strong>{r.prenomEtudiant} {r.nomEtudiant}</strong>
                  <p><a href={`${BASE}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">Voir le rapport</a></p>
                  <Form.Control as="textarea" rows={2} value={commentaires[r.id] || ''} onChange={e => handleCommentChange(r.id, e.target.value)} />
                  <div className="mt-2 d-flex gap-2">
                    <Button size="sm" onClick={() => commenterRapport(r.id)}>Commenter</Button>
                    <Button size="sm" variant="success" onClick={() => validerRapport(r.id)}>Valider</Button>
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </Card.Body>
      </Card>

      {/* Historique */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Historique des Actions</Card.Header>
        <Card.Body>
          {historique.length === 0 ? (
            <p className="text-muted">Aucune action enregistrée.</p>
          ) : (
            <ListGroup>
              {historique.map(entry => (
                <ListGroup.Item key={entry.id}>
                  [{new Date(entry.dateAction).toLocaleString()}] — {entry.description}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Rapports validés */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Rapports Validés</Card.Header>
        <Card.Body>
          {rapportsHistoriques.length === 0 ? (
            <p className="text-muted">Aucun rapport validé.</p>
          ) : (
            <ul>
              {rapportsHistoriques.map((r, i) => (
                <li key={i}>
                  <strong>{r.identifiantRapport}</strong> — {r.titre}
                  {" | "}
                  <a href={`${BASE}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">Voir PDF</a>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>

      {/* Stagiaires encadrés */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Mes Stagiaires</Card.Header>
        <Card.Body>
          {stagiaires.length === 0 ? (
            <p className="text-muted">Aucun stagiaire affecté.</p>
          ) : (
            <ListGroup>
              {stagiaires.map((s, i) => (
                <ListGroup.Item key={i}>
                  <strong>{s.prenom} {s.nom}</strong> — {s.email}<br />
                  <span><strong>Stage :</strong> {s.titreStage}</span><br />
                  <span><strong>Période :</strong> {new Date(s.dateDebut).toLocaleDateString()} → {new Date(s.dateFin).toLocaleDateString()}</span><br />
                  {s.identifiantRapport ? (
                    <span>
                      <strong>Rapport :</strong>{" "}
                      <a href={`${BASE}/uploads/${s.identifiantRapport}.pdf`} target="_blank" rel="noreferrer">Voir PDF</a>
                    </span>
                  ) : (
                    <span className="text-muted">Rapport non disponible</span>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default DashboardEncadrantPro;
