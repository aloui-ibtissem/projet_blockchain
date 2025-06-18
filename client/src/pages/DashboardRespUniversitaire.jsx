import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, ListGroup, Button, Collapse, Alert, Spinner, Badge } from 'react-bootstrap';
import './DashboardRespEntreprise.css'; // même style que celui de l'entreprise

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function DashboardRespUniversitaire() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [encadrants, setEncadrants] = useState([]);
  const [attestations, setAttestations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('attestations');

  useEffect(() => {
    if (!token || role !== 'ResponsableUniversitaire') return navigate('/login');
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      return navigate('/login');
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [encadrantRes, notifRes, attestRes] = await Promise.all([
        axios.get(`${API_URL}/api/stage/resp-univ/encadrants`, { headers }),
        axios.get(`${API_URL}/api/stage/notifications`, { headers }),
        axios.get(`${API_URL}/api/attestation/attestations/universite`, { headers })
      ]);
      setEncadrants(encadrantRes.data || []);
      setNotifications(notifRes.data || []);
      setAttestations(attestRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  const validerStage = async (stageId) => {
    try {
      const res = await axios.post(`${API_URL}/api/attestation/valider-stage/${stageId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || "Stage validé avec succès.");
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || "Erreur lors de la validation du stage.";
      setMessage(msg);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="header-container">Responsable Universitaire</div>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <ul>
            <li>
              <button className={activeSection === 'attestations' ? 'active' : ''} onClick={() => setActiveSection('attestations')}>
                Attestations générées
              </button>
            </li>
            <li>
              <button className={activeSection === 'encadrants' ? 'active' : ''} onClick={() => setActiveSection('encadrants')}>
                Encadrants académiques
              </button>
            </li>
            <li>
              <button className={activeSection === 'notifications' ? 'active' : ''} onClick={() => setActiveSection('notifications')}>
                Notifications
              </button>
            </li>
          </ul>
        </aside>

        <main className="dashboard-main">
          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : (
            <div className="dashboard-section">
              {message && <Alert variant="danger">{message}</Alert>}

              {activeSection === 'attestations' && (
                <Card className="dashboard-card">
                  <Card.Header>Attestations générées</Card.Header>
                  <Card.Body>
                    {attestations.length > 0 ? (
                      <ListGroup>
                        {attestations.map(att => (
                          <ListGroup.Item key={att.stageId}>
                            <strong>Étudiant :</strong> {att.etudiantPrenom} {att.etudiantNom}<br />
                            <strong>Stage :</strong> {att.titre} ({att.identifiantStage})<br />
                            <strong>Identifiant :</strong> {att.identifiant}<br />
                            <strong>Date :</strong> {new Date(att.dateCreation).toLocaleDateString()}<br />
                            <strong>État :</strong>{' '}
                            {att.etat === 'validé' ? (
                              <Badge bg="success">Stage validé</Badge>
                            ) : (
                              <Badge bg="warning text-dark">En attente</Badge>
                            )}
                            <div className="d-flex justify-content-between mt-2">
                              <a href={att.ipfsUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm">
                                Voir PDF
                              </a>
                              {att.etat !== 'validé' && (
                                <Button size="sm" variant="success" onClick={() => validerStage(att.stageId)}>
                                  Valider
                                </Button>
                              )}
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : <p className="text-muted">Aucune attestation disponible.</p>}
                  </Card.Body>
                </Card>
              )}

              {activeSection === 'encadrants' && (
                <Card className="dashboard-card">
                  <Card.Header>Encadrants Académiques</Card.Header>
                  <Card.Body>
                    {encadrants.length > 0 ? (
                      <ListGroup>
                        {encadrants.map(e => (
                          <ListGroup.Item key={e.id}>
                            <strong>{e.nom} {e.prenom}</strong> — {e.email}<br />
                            ID : {e.identifiant_unique} | Stagiaires : {e.nombreStagiaires}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : <p className="text-muted">Aucun encadrant trouvé.</p>}
                  </Card.Body>
                </Card>
              )}

              {activeSection === 'notifications' && (
                <Card className="dashboard-card">
                  <Card.Header>Notifications</Card.Header>
                  <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      <ListGroup>
                        {notifications.map((notif, idx) => (
                          <ListGroup.Item key={idx}>
                            <strong>{notif.subject}</strong><br />
                            {notif.message}<br />
                            <small>{new Date(notif.date).toLocaleString()}</small>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : <p className="text-muted">Aucune notification disponible.</p>}
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

export default DashboardRespUniversitaire;
