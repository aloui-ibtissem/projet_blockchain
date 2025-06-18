import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, Card, Button, ListGroup, Form, Collapse, Spinner } from 'react-bootstrap';
import SkeletonLoader from '../components/SkeletonLoader';
import './DashboardEncadrantAca.css';

const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
const API_URL = BASE.includes('/api') ? BASE : `${BASE}/api`;

function DashboardEncadrantPro() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('propositions');
  const [notifications, setNotifications] = useState([]);
  const [propositions, setPropositions] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [stagiaires, setStagiaires] = useState([]);
  const [commentaires, setCommentaires] = useState({});

  useEffect(() => {
    if (!token || role !== 'EncadrantProfessionnel') {
      navigate('/login');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.clear();
        navigate('/login');
        return;
      }
    } catch {
      localStorage.clear();
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [notifRes, propRes, rapRes, stagRes] = await Promise.all([
        axios.get(`${API_URL}/notifications/mes`, { headers }),
        axios.get(`${API_URL}/stage/propositions`, { headers }),
        axios.get(`${API_URL}/rapport/encadrant`, { headers }),
        axios.get(`${API_URL}/stage/encadrant/stagiaires`, { headers })
      ]);
      setNotifications(notifRes.data || []);
      setPropositions(propRes.data || []);
      setRapports(rapRes.data?.enAttente || []);
      setStagiaires(stagRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage("Erreur de chargement des données.");
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
      await fetchData();
    } catch {
      setMessage("Erreur lors de la validation de la proposition.");
    }
  };

  const validerRapport = async (id) => {
    try {
      await axios.post(`${API_URL}/rapport/valider`, { rapportId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Rapport validé.");
      await fetchData();
    } catch {
      setMessage("Erreur lors de la validation du rapport.");
    }
  };

  const commenterRapport = async (id) => {
    const texte = commentaires[id];
    if (!texte?.trim()) return;
    try {
      await axios.post(`${API_URL}/rapport/comment`, {
        rapportId: id,
        commentaire: texte
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCommentaires(prev => ({ ...prev, [id]: '' }));
      setMessage("Commentaire ajouté.");
      await fetchData();
    } catch {
      setMessage("Erreur lors de l'envoi du commentaire.");
    }
  };

  const handleCommentChange = (id, value) => {
    setCommentaires(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="dashboard-wrapper">
      <div className="header-container">Encadrant Professionnel</div>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <ul>
            <li><button className={activeSection === 'propositions' ? 'active' : ''} onClick={() => setActiveSection('propositions')}>Propositions</button></li>
            <li><button className={activeSection === 'rapports' ? 'active' : ''} onClick={() => setActiveSection('rapports')}>Rapports</button></li>
            <li><button className={activeSection === 'stagiaires' ? 'active' : ''} onClick={() => setActiveSection('stagiaires')}>Stagiaires</button></li>
            <li><button className={activeSection === 'notifications' ? 'active' : ''} onClick={() => setActiveSection('notifications')}>Notifications</button></li>
          </ul>
        </aside>
        <main className="dashboard-main">
          {loading ? <SkeletonLoader /> : (
            <div className="dashboard-section">
              {message && <Alert variant="info">{message}</Alert>}

              {activeSection === 'propositions' && (
                <Card className="dashboard-card">
                  <Card.Header>Propositions</Card.Header>
                  <Card.Body>
                    {propositions.length > 0 ? (
                      <ListGroup>
                        {propositions.map(p => (
                          <ListGroup.Item key={p.id}>
                            <strong>{p.titre}</strong><br />
                            Du {new Date(p.dateDebut).toLocaleDateString()} au {new Date(p.dateFin).toLocaleDateString()}<br />
                            <Button size="sm" variant="success" onClick={() => handleDecision(p.id, 'accepter')} className="me-2">Accepter</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDecision(p.id, 'rejeter')}>Refuser</Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : <p className="text-muted">Aucune proposition.</p>}
                  </Card.Body>
                </Card>
              )}

              {activeSection === 'rapports' && (
                <Card className="dashboard-card">
                  <Card.Header>Rapports à valider</Card.Header>
                  <Card.Body>
                    {rapports.length > 0 ? rapports.map(r => (
                      <Card key={r.id} className="mb-3">
                        <Card.Body>
                          <strong>{r.prenomEtudiant} {r.nomEtudiant}</strong><br />
                          <a href={`${BASE}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">Voir le rapport</a>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={commentaires[r.id] || ''}
                            onChange={e => handleCommentChange(r.id, e.target.value)}
                            className="mt-2"
                          />
                          <div className="mt-2 d-flex gap-2">
                            <Button size="sm" onClick={() => commenterRapport(r.id)}>Commenter</Button>
                            <Button size="sm" variant="success" onClick={() => validerRapport(r.id)}>Valider</Button>
                          </div>
                        </Card.Body>
                      </Card>
                    )) : <p className="text-muted">Aucun rapport à valider.</p>}
                  </Card.Body>
                </Card>
              )}

              {activeSection === 'stagiaires' && (
                <Card className="dashboard-card">
                  <Card.Header>Mes Stagiaires</Card.Header>
                  <Card.Body>
                    {stagiaires.length > 0 ? (
                      <ListGroup>
                        {stagiaires.map((s, i) => (
                          <ListGroup.Item key={i}>
                            <strong>{s.prenom} {s.nom}</strong> — {s.email}<br />
                            <strong>Stage :</strong> {s.titreStage}<br />
                            <strong>Période :</strong> {new Date(s.dateDebut).toLocaleDateString()} → {new Date(s.dateFin).toLocaleDateString()}<br />
                            {s.identifiantRapport ? (
                              <span><strong>Rapport :</strong> <a href={`${BASE}/uploads/${s.fichierRapport}`} target="_blank" rel="noreferrer">Voir PDF</a></span>
                            ) : <span className="text-muted">Rapport non disponible</span>}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : <p className="text-muted">Aucun stagiaire affecté.</p>}
                  </Card.Body>
                </Card>
              )}

              {activeSection === 'notifications' && (
                <Card className="dashboard-card">
                  <Card.Header>Notifications</Card.Header>
                  <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id}>
                        {n.message} <span className="notification-date">{new Date(n.date_envoi).toLocaleString()}</span>
                      </div>
                    )) : <p className="text-muted">Aucune notification.</p>}
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardEncadrantPro;
