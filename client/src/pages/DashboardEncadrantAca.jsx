import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import { Alert, Card, Button, Form, Table, Badge, Collapse, ListGroup } from 'react-bootstrap';
import './DashboardEncadrantAca.css';

const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
const API_URL = BASE.includes('/api') ? BASE : `${BASE}/api`;

function DashboardEncadrantAca() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [propositions, setPropositions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [commentaires, setCommentaires] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [historique, setHistorique] = useState([]);

  // Ajouts
  const [rapportsHistoriques, setRapportsHistoriques] = useState([]);
  const [stagiaires, setStagiaires] = useState([]);

  useEffect(() => {
    if (!token || role !== 'EncadrantAcademique') return navigate('/login');
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
      const headers = { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' };
      const [propRes, notifRes, rapRes, histRes, rapHistRes, stagiairesRes] = await Promise.all([
        axios.get(`${API_URL}/stage/propositions`, { headers }),
        axios.get(`${API_URL}/notifications/mes`, { headers }),
        axios.get(`${API_URL}/rapport/encadrant`, { headers }),
        axios.get(`${API_URL}/historique/mes`, { headers }),
        axios.get(`${API_URL}/rapport/encadrant/historique`, { headers }),
        axios.get(`${API_URL}/encadrant/mes-stagiaires`, { headers }),
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
      setMessage(`Proposition ${action === 'accepter' ? 'acceptée' : 'refusée'}.`);
      await loadData();
    } catch {
      setMessage("Erreur lors de la validation.");
    }
  };

  const validerRapport = async (id) => {
    try {
      await axios.post(`${API_URL}/rapport/valider`, { rapportId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Rapport validé.");
      await loadData();
    } catch {
      setMessage("Erreur validation.");
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
      setMessage("Commentaire envoyé.");
      await loadData();
    } catch {
      setMessage("Erreur commentaire.");
    }
  };

  const handleCommentChange = (id, value) => {
    setCommentaires(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="dashboard-content p-4">
      <Header title="Encadrant Académique" />
      <main className="main-content">
        {message && <Alert variant="info">{message}</Alert>}
        {loading ? <SkeletonLoader /> : (
          <div className="dashboard-grid">

            {/* Notifications */}
            <Card className="dashboard-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                Notifications <Badge bg="secondary">{notifications.length}</Badge>
                <Button variant="outline-primary" size="sm" onClick={() => setShowNotif(!showNotif)}>
                  {showNotif ? 'Masquer' : 'Afficher'}
                </Button>
              </Card.Header>
              <Collapse in={showNotif}>
                <Card.Body style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {notifications.length > 0 ? (
                    <ul>
                      {notifications.map(n => (
                        <li key={n.id}>
                          <strong>{n.message}</strong>
                          <small> ({new Date(n.date_envoi).toLocaleDateString()})</small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">Aucune notification.</p>
                  )}
                </Card.Body>
              </Collapse>
            </Card>

            {/* Propositions */}
            <Card className="dashboard-card">
              <Card.Header>Propositions</Card.Header>
              <Card.Body>
                {propositions.length === 0 ? <p>Aucune proposition.</p> : (
                  <Table striped bordered>
                    <thead><tr><th>Titre</th><th>Dates</th><th>Actions</th></tr></thead>
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

            {/* Rapports en attente */}
            <Card className="dashboard-card">
              <Card.Header>Rapports à Valider</Card.Header>
              <Card.Body>
                {rapports.length === 0 ? (
                  <p>Aucun rapport.</p>
                ) : (
                  rapports.map(r => (
                    <Card key={r.id} className="inner-card mb-3">
                      <Card.Body>
                        <strong>{r.prenomEtudiant} {r.nomEtudiant}</strong>
                        <p><a href={`${BASE}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">Voir le rapport</a></p>
                        <Form.Control as="textarea" value={commentaires[r.id] || ''} onChange={e => handleCommentChange(r.id, e.target.value)} rows={2} />
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

            {/* Historique des actions */}
            <Card className="dashboard-card">
              <Card.Header>Historique des actions</Card.Header>
              <Card.Body>
                {historique.length === 0 ? (
                  <p className="text-muted">Aucune action enregistrée.</p>
                ) : (
                  <ListGroup>
                    {historique.map((entry) => (
                      <ListGroup.Item key={entry.id}>
                        [{new Date(entry.dateAction).toLocaleString()}] — {entry.description}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>

            {/* Rapports validés */}
            <Card className="dashboard-card">
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
                        <a href={`${BASE}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">
                          Voir PDF
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>

            {/* Stagiaires encadrés */}
            <Card className="dashboard-card">
              <Card.Header>Mes Stagiaires</Card.Header>
              <Card.Body>
                {stagiaires.length === 0 ? (
                  <p className="text-muted">Aucun stagiaire affecté.</p>
                ) : (
                  <ul>
                    {stagiaires.map((s, i) => (
                      <li key={i}>
                        <strong>{s.prenom} {s.nom}</strong> — {s.email}<br />
                        Stage : <em>{s.titreStage}</em> ({new Date(s.dateDebut).toLocaleDateString()} → {new Date(s.dateFin).toLocaleDateString()})
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardEncadrantAca;
