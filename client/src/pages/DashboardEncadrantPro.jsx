import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import { Alert, Card, Button, Form, Table } from 'react-bootstrap';
import './DashboardEncadrantAca.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function DashboardEncadrantPro() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [propositions, setPropositions] = useState([]);
  const [historiqueProps, setHistoriqueProps] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [commentaires, setCommentaires] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

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
    loadData();
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
      setMessage("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id, action) => {
    try {
      await axios.post(`${API_URL}/api/stage/valider`, { sujetId: id, action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const propTraitee = propositions.find(p => p.id === id);
      setHistoriqueProps(prev => [...prev, { ...propTraitee, action }]);
      setPropositions(prev => prev.filter(p => p.id !== id));
      setMessage(`Sujet ${action === 'accepter' ? 'accepté' : 'refusé'}.`);
    } catch {
      setMessage("Erreur lors du traitement de la proposition.");
    }
  };

  const validerRapport = async (rapportId) => {
    try {
      await axios.post(`${API_URL}/api/rapport/valider`, { rapportId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommentaires(prev => ({ ...prev, [rapportId]: '' }));
      setMessage("Rapport validé.");
      loadData();
    } catch {
      setMessage("Erreur lors de la validation du rapport.");
    }
  };

  const commenterRapport = async (rapportId) => {
    const texte = commentaires[rapportId];
    if (!texte?.trim()) return;
    try {
      await axios.post(`${API_URL}/api/rapport/comment`, { rapportId, commentaire: texte }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommentaires(prev => ({ ...prev, [rapportId]: '' }));
      setMessage("Commentaire ajouté.");
      loadData();
    } catch {
      setMessage("Erreur lors de l'envoi du commentaire.");
    }
  };

  const handleCommentChange = (id, value) => {
    setCommentaires(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-content">
        <Header title="Encadrant Professionnel" />
        <main className="main-content">
          {message && <Alert variant="info">{message}</Alert>}
          {loading ? (
            <SkeletonLoader />
          ) : (
            <div className="dashboard-grid">

              {/* Notifications */}
              <Card className="dashboard-card">
                <Card.Header>Notifications</Card.Header>
                <Card.Body style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {notifications.length ? (
                    <ul className="notification-list">
                      {notifications.map(n => (
                        <li key={n.id}>
                          {n.message}
                          <span className="notification-date">
                            {new Date(n.date_envoi).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">Aucune notification</p>
                  )}
                </Card.Body>
              </Card>

              {/* Propositions en attente */}
              <Card className="dashboard-card">
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
                        {propositions.map(p => (
                          <tr key={p.id}>
                            <td>{p.titre}</td>
                            <td>{new Date(p.dateDebut).toLocaleDateString()} - {new Date(p.dateFin).toLocaleDateString()}</td>
                            <td>
                              <Button size="sm" variant="success" className="me-2" onClick={() => handleDecision(p.id, 'accepter')}>Accepter</Button>
                              <Button size="sm" variant="danger" onClick={() => handleDecision(p.id, 'rejeter')}>Rejeter</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>

              {/* Rapports à valider */}
              <Card className="dashboard-card">
                <Card.Header>Rapports à Valider</Card.Header>
                <Card.Body>
                  {rapports.filter(r => !r.statutProfessionnel).length === 0 ? (
                    <p className="text-muted">Aucun rapport à examiner.</p>
                  ) : (
                    rapports.filter(r => !r.statutProfessionnel).map(r => (
                      <Card key={r.id} className="inner-card mb-3">
                        <Card.Body>
                          <strong>{r.prenomEtudiant} {r.nomEtudiant}</strong>
                          <br />
                          <a href={`${API_URL}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">Voir le rapport</a>
                          <Form.Control as="textarea" rows={2} placeholder="Votre commentaire"
                            value={commentaires[r.id] || ''}
                            className="mt-2"
                            onChange={e => handleCommentChange(r.id, e.target.value)} />
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

              {/* Rapports validés */}
              <Card className="dashboard-card mt-4">
                <Card.Header>Rapports Validés</Card.Header>
                <Card.Body>
                  {rapports.filter(r => r.statutProfessionnel).length === 0 ? (
                    <p className="text-muted">Aucun rapport validé.</p>
                  ) : (
                    <ul>
                      {rapports.filter(r => r.statutProfessionnel).map(r => (
                        <li key={r.id}>
                          <strong>{r.identifiantRapport}</strong> — {r.titre} —
                          <a href={`${API_URL}/uploads/${r.fichier}`} target="_blank" rel="noreferrer" style={{ marginLeft: '10px' }}>
                            Voir PDF
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>

              {/* Propositions traitées */}
              <Card className="dashboard-card mt-4">
                <Card.Header>Propositions Traitées</Card.Header>
                <Card.Body>
                  {historiqueProps.length === 0 ? (
                    <p className="text-muted">Aucune proposition traitée.</p>
                  ) : (
                    <ul>
                      {historiqueProps.map((p, idx) => (
                        <li key={idx}>
                          <strong>{p.titre}</strong> — {p.action === 'accepter' ? '✅ Acceptée' : '❌ Refusée'}
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
    </div>
  );
}

export default DashboardEncadrantPro;
