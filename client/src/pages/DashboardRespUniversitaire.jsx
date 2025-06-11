import React, { useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import { Alert, Card, Button, ListGroup, Badge, Row, Col, Collapse } from 'react-bootstrap';
import { FaBell } from 'react-icons/fa';
import './DashboardRespUniversite.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function DashboardRespUniversitaire() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [attestations, setAttestations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [historique, setHistorique] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [attestRes, notifRes, histRes] = await Promise.all([
        axios.get(`${API_URL}/api/attestation/attestations/universite`, { headers }),
        axios.get(`${API_URL}/api/stage/notifications`, { headers }),
        axios.get(`${API_URL}/api/historique/mes`, { headers })
      ]);
      setAttestations(attestRes.data || []);
      setNotifications(notifRes.data || []);
      setHistorique(histRes.data || []);
    } catch (err) {
      setMessage("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || role !== 'ResponsableUniversitaire') {
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
  }, [token, role, navigate, fetchData]);

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
      <Sidebar role={role} />
      <div className="dashboard-content flex-grow-1">
        <Header title="Responsable Universitaire">
          <Button
            variant={showNotif ? "secondary" : "outline-secondary"}
            onClick={() => setShowNotif(!showNotif)}
            className="ms-auto"
          >
            <FaBell className="me-2" />
            {showNotif ? 'Masquer' : 'Afficher'} Notifications
          </Button>
        </Header>

        <main className="main-content p-4">
          {message && <Alert variant="info">{message}</Alert>}
          {loading ? (
            <SkeletonLoader />
          ) : (
            <Row className="g-4">
              <Col lg={showNotif ? 9 : 12}>
                <Card className="shadow-sm border-0">
                  <Card.Header className="bg-primary text-white fw-bold">
                    Attestations Générées
                  </Card.Header>
                  <Card.Body>
                    {attestations.length === 0 ? (
                      <p className="text-muted">Aucune attestation pour l’instant.</p>
                    ) : (
                      <div className="vstack gap-3">
                        {attestations.map(att => (
                          <Card
                            key={att.stageId}
                            className="p-3 border-start border-4 border-primary bg-white rounded shadow-sm"
                          >
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
                            <div className="d-flex justify-content-between mt-3">
                              <a
                                href={att.ipfsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-outline-primary"
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
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>

                <Card className="shadow-sm border-0 mt-4">
                  <Card.Header className="bg-secondary text-white fw-bold">
                    Historique des Actions
                  </Card.Header>
                  <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {historique.length === 0 ? (
                      <p className="text-muted">Aucune action enregistrée.</p>
                    ) : (
                      <ListGroup>
                        {historique.map((histo) => (
                          <ListGroup.Item key={histo.id}>
                            [{new Date(histo.dateAction).toLocaleString()}] — {histo.description}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {showNotif && (
                <Col lg={3}>
                  <Collapse in={showNotif}>
                    <div>
                      <Card className="shadow-sm border-0">
                        <Card.Header className="bg-dark text-white fw-bold">
                          Notifications
                        </Card.Header>
                        <Card.Body style={{ maxHeight: '420px', overflowY: 'auto' }}>
                          {notifications.length === 0 ? (
                            <p className="text-muted">Aucune notification</p>
                          ) : (
                            <ListGroup>
                              {notifications.map((notif, idx) => (
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
        </main>
      </div>
    </div>
  );
}

export default DashboardRespUniversitaire;
