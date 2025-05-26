import React, { useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import { Alert, Card, Button, ListGroup, Badge } from 'react-bootstrap';
import './DashboardRespUniversite.css';

const API_URL = window.location.origin.replace(':3001', ':3000');

function DashboardRespUniversitaire() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const [attestations, setAttestations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [attestRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/attestation/attestations/universite`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/stage/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAttestations(attestRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      setMessage("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || role !== 'ResponsableUniversitaire') return navigate('/login');
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      return navigate('/login');
    }
    fetchData();
  }, [token, role, navigate, fetchData]);

  const validerStage = async (stageId) => {
    try {
      const res = await axios.post(`${API_URL}/api/attestation/valider-stage/${stageId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || "Stage validé avec succès");
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || "Erreur lors de la validation du stage";
      setMessage(msg);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-content">
        <Header title="Responsable Universitaire" />
        <main className="main-content">
          {message && <Alert variant="info">{message}</Alert>}
          {loading ? (
            <SkeletonLoader />
          ) : (
            <div className="dashboard-grid">
              <Card className="dashboard-card">
                <Card.Header>Attestations Générées</Card.Header>
                <Card.Body>
                  {attestations.length === 0 ? (
                    <p className="text-muted">Aucune attestation pour l’instant.</p>
                  ) : (
                    attestations.map(att => (
                      <Card key={att.id} className="inner-card">
                        <Card.Body>
                          <strong>Étudiant :</strong> {att.etudiantPrenom} {att.etudiantNom}<br />
                          <strong>Stage :</strong> {att.identifiant_unique}<br />
                          <strong>Identifiant Attestation :</strong> {att.identifiant}<br />
                          <strong>Date :</strong> {new Date(att.dateCreation).toLocaleDateString()}<br />
                          <strong>État :</strong>{' '}
                          {att.etat === 'validé' ? (
                            <Badge bg="success">Stage validé</Badge>
                          ) : (
                            <Badge bg="warning">En attente</Badge>
                          )}
                          <div className="mt-2 text-end">
                            <a href={att.ipfsUrl} target="_blank" rel="noreferrer" className="btn btn-link p-0">
                              Voir le PDF
                            </a>
                            {att.etat !== 'validé' && (
                              <Button
                                variant="success"
                                size="sm"
                                className="mt-2"
                                onClick={() => validerStage(att.stageId)}
                              >
                                Valider officiellement
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </Card.Body>
              </Card>

              <Card className="dashboard-card">
                <Card.Header>Notifications</Card.Header>
                <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p className="text-muted">Aucune notification</p>
                  ) : (
                    <ListGroup>
                      {notifications.map(n => (
                        <ListGroup.Item key={n.id}>
                          {n.message} — <small className="notification-date">{new Date(n.date_envoi).toLocaleString()}</small>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
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

export default DashboardRespUniversitaire;