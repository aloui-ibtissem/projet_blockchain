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
  const [notifications, setNotifications] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [commentaire, setCommentaire] = useState('');
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
  }, [token, role, navigate]);

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
      setMessage('Erreur de chargement du tableau de bord.');
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
                            <td>
                              Du {new Date(p.dateDebut).toLocaleDateString()} au{' '}
                              {new Date(p.dateFin).toLocaleDateString()}
                            </td>
                            <td>
                              <Button
                                size="sm"
                                className="btn-accept"
                                onClick={() => handleDecision(p.id, 'accepter')}
                              >
                                Accepter
                              </Button>{' '}
                              <Button
                                size="sm"
                                className="btn-reject"
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

              <Card className="dashboard-card">
                <Card.Header>Rapports à Valider</Card.Header>
                <Card.Body>
                  {rapports.length === 0 ? (
                    <p className="text-muted">Aucun rapport à examiner.</p>
                  ) : (
                    rapports.map(r => (
                      <Card key={r.id} className="inner-card">
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
                            onChange={e => setCommentaire(e.target.value)}
                          />
                          <div className="mt-2">
                            <Button
                              size="sm"
                              onClick={() => commenterRapport(r.id)}
                            >
                              Commenter
                            </Button>{' '}
                            <Button
                              size="sm"
                              className="btn-accept"
                              onClick={() => validerRapport(r.id)}
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
              <Card className="dashboard-card mt-4">
  <Card.Header> Rapports Validés</Card.Header>
  <Card.Body>
    {rapports.filter(r => r.statutAcademique).length === 0 ? (
      <p className="text-muted">Aucun rapport validé.</p>
    ) : (
      <ul>
        {rapports.filter(r => r.statutAcademique).map(r => (
          <li key={r.id}>
            <strong>{r.identifiantRapport}</strong> — {r.titre} —
            <a
              href={`${API_URL}/uploads/${r.fichier}`}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: '10px' }}
            >
              Voir PDF
            </a>
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


