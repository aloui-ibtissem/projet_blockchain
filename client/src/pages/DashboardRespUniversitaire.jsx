import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  Container, Card, ListGroup, Button, Collapse, Row, Col, Alert, Badge, Spinner
} from 'react-bootstrap';
import { FaBell } from 'react-icons/fa';
import './DashboardRespUniversite.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function DashboardRespUniversitaire() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [encadrants, setEncadrants] = useState([]);
  const [attestations, setAttestations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

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

      setEncadrants(Array.isArray(encadrantRes.data) ? encadrantRes.data : []);
      setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
      setAttestations(Array.isArray(attestRes.data) ? attestRes.data : []);
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
    <div className="dashboard-layout d-flex bg-light">
      <div className="dashboard-content flex-grow-1">
    
        <main className="main-content p-4">
          <Container className="mt-2 dashboard-etudiant">
            <h2 className="text-center mb-4">Tableau de Bord Responsable Universitaire</h2>
            {message && <Alert variant="danger">{message}</Alert>}
            {loading ? (
              <div className="text-center"><Spinner animation="border" /></div>
            ) : (
              <Row className="g-4">
                <Col lg={showNotif ? 9 : 12}>
                  {/* Attestations Générées */}
                  <Card className="mb-4 shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      Attestations Générées <Badge bg="primary">{attestations.length}</Badge>
                    </Card.Header>
                    <Card.Body>
                      {attestations.length === 0 ? (
                        <p className="text-muted">Aucune attestation pour l’instant.</p>
                      ) : (
                        <ListGroup>
                          {Array.isArray(attestations) && attestations.map(att => (
                            <ListGroup.Item key={att.stageId} className="mb-2 border rounded shadow-sm p-3">
                              <p><strong>Étudiant :</strong> {att.etudiantPrenom} {att.etudiantNom}</p>
                              <p><strong>Stage :</strong> {att.titre} ({att.identifiantStage})</p>
                              <p><strong>Identifiant :</strong> {att.identifiant}</p>
                              <p><strong>Date :</strong> {new Date(att.dateCreation).toLocaleDateString()}</p>
                              <p>
                                <strong>État :</strong>{' '}
                                {att.etat === 'validé' ? (
                                  <Badge bg="success">Stage validé</Badge>
                                ) : (
                                  <Badge bg="warning text-dark">En attente</Badge>
                                )}
                              </p>
                              <div className="d-flex justify-content-between mt-2">
                                <a
                                  href={att.ipfsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline-primary btn-sm"
                                >
                                  Voir le PDF
                                </a>
                                {att.etat !== 'validé' && (
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => validerStage(att.stageId)}
                                  >
                                    Valider
                                  </Button>
                                )}
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Encadrants Académiques */}
                  <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-secondary text-white fw-bold">
                      Encadrants Académiques
                    </Card.Header>
                    <Card.Body>
                      {encadrants.length > 0 ? (
                        <ListGroup>
                          {Array.isArray(encadrants) && encadrants.map(e => (
                            <ListGroup.Item key={e.id}>
                              <strong>{e.nom} {e.prenom}</strong> — {e.email}<br />
                              ID : {e.identifiant_unique} | Stagiaires : {e.nombreStagiaires}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      ) : (
                        <p className="text-muted">Aucun encadrant académique trouvé.</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Notifications */}
                {showNotif && (
                  <Col lg={3}>
                    <Collapse in={showNotif}>
                      <div>
                        <Card className="shadow-sm">
                          <Card.Header className="bg-dark text-white fw-bold">
                            Notifications
                          </Card.Header>
                          <Card.Body style={{ maxHeight: '420px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                              <p className="text-muted">Aucune notification</p>
                            ) : (
                              <ListGroup>
                                {Array.isArray(notifications) && notifications.map((notif, idx) => (
                                  <ListGroup.Item key={idx}>
                                    <strong>{notif.subject}</strong><br />
                                    {notif.message}<br />
                                    <small>{new Date(notif.date).toLocaleString()}</small>
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            )}
                          </Card.Body>
                        </Card>
                      </div>
                    </Collapse>
                  </Col>
                )}
              </Row>
            )}
          </Container>
        </main>
      </div>
    </div>
  );
}

export default DashboardRespUniversitaire;
