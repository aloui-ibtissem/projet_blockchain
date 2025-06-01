import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Row, Col, Card, Button, Form, Alert, Collapse, Spinner, Badge
} from 'react-bootstrap';
import './DashboardEtudiant.css';

const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
const API_URL = BASE.includes('/api') ? BASE : `${BASE}/api`;

function DashboardEtudiant() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [form, setForm] = useState({
    sujet: '', objectifs: '', dateDebut: '', dateFin: '',
    encadrantAcademique: '', encadrantProfessionnel: ''
  });

  const [rapport, setRapport] = useState(null);
  const [cibles, setCibles] = useState({
    EncadrantAcademique: false, EncadrantProfessionnel: false
  });

  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [commentaires, setCommentaires] = useState([]);
  const [attestationUrl, setAttestationUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [stagesHistoriques, setStagesHistoriques] = useState([]);
  const [rapportsHistoriques, setRapportsHistoriques] = useState([]);

  useEffect(() => {
    if (!token || role !== 'Etudiant') return navigate('/login');
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      return navigate('/login');
    }
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        fetchStage(),
        fetchNotifications(),
        fetchMesRapports(),
        fetchStagesHistoriques()
      ]);
    } catch (err) {
      console.error("Erreur initiale :", err);
      setMessage("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCheckboxChange = (e) => setCibles({ ...cibles, [e.target.name]: e.target.checked });

  const proposeStage = async () => {
    try {
      setMessage('Envoi de la proposition...');
      await axios.post(`${API_URL}/stage/proposer`, form, {
        headers: { Authorization: `Bearer ${token}`, withCredentials: true }
      });
      setMessage('Stage proposé avec succès.');
      setForm({ sujet: '', objectifs: '', dateDebut: '', dateFin: '', encadrantAcademique: '', encadrantProfessionnel: '' });
      await Promise.all([fetchStage(), fetchStagesHistoriques(), fetchNotifications()]);
      setTimeout(() => setMessage(''), 5000);
    } catch {
      setMessage("Erreur lors de la proposition du stage.");
    }
  };

  const submitRapport = async () => {
    if (!rapport) return setMessage("Veuillez sélectionner un fichier.");
    const destinataires = Object.keys(cibles).filter(k => cibles[k]);
    if (destinataires.length === 0) return setMessage("Veuillez cocher au moins un encadrant.");

    const formData = new FormData();
    formData.append("fichier", rapport);
    formData.append("cibles", JSON.stringify(destinataires));

    try {
      await axios.post(`${API_URL}/rapport/soumettre`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          withCredentials: true,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage("Rapport soumis avec succès.");
      setRapport(null);
      setCibles({ EncadrantAcademique: false, EncadrantProfessionnel: false });
      await Promise.all([fetchStage(), fetchMesRapports(), fetchStagesHistoriques(), fetchNotifications()]);
      setTimeout(() => setMessage(''), 5000);
    } catch {
      setMessage("Erreur lors de la soumission du rapport.");
    }
  };

  const fetchStage = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/mon-stage`, {
        headers: { Authorization: `Bearer ${token}`, withCredentials: true }
      });
      setCurrentStage(res.data);
      if (res.data?.rapportId) fetchCommentaires(res.data.rapportId);
    } catch {
      setCurrentStage(null);
    }
  };

  const fetchCommentaires = async (rapportId) => {
    try {
      const res = await axios.get(`${API_URL}/rapport/commentaires/${rapportId}`, {
        headers: { Authorization: `Bearer ${token}`, withCredentials: true }
      });
      setCommentaires(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCommentaires([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/notifications`, {
        headers: { Authorization: `Bearer ${token}`, withCredentials: true }
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNotifications([]);
    }
  };

  const fetchMesRapports = async () => {
    try {
      const res = await axios.get(`${API_URL}/rapport/mes-rapports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRapportsHistoriques(res.data);
    } catch {
      setRapportsHistoriques([]);
    }
  };

  const fetchStagesHistoriques = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/historique`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStagesHistoriques(res.data);
    } catch {
      setStagesHistoriques([]);
    }
  };

  const fetchAttestation = async () => {
    try {
      const res = await axios.get(`${API_URL}/attestation/etudiant/ma-attestation`, {
        headers: { Authorization: `Bearer ${token}`, withCredentials: true }
      });
      setAttestationUrl(res.data.attestationUrl || '');
    } catch {
      setMessage("Aucune attestation disponible.");
    }
  };

  const downloadAttestation = async () => {
    try {
      const res = await axios.get(`${API_URL}/attestation/download`, {
        headers: { Authorization: `Bearer ${token}`, withCredentials: true },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attestation.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setMessage("Erreur lors du téléchargement.");
    }
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
      <h2 className="text-center mb-4"> Tableau de Bord Étudiant</h2>
      {message && <Alert variant="info">{message}</Alert>}

      <Card className="mb-4 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          Notifications <Badge bg="secondary">{notifications.length}</Badge>
          <Button size="sm" onClick={() => setShowNotif(!showNotif)} variant="outline-primary">
            {showNotif ? "Masquer" : "Afficher"}
          </Button>
        </Card.Header>
        <Collapse in={showNotif}>
          <Card.Body style={{ maxHeight: 180, overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              <ul className="notification-list">
                {notifications.map(n => (
                  <li key={n.id}>
                    <strong>{n.message}</strong>
                    <small className="notification-date"> ({new Date(n.date_envoi).toLocaleDateString()})</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">Aucune notification</p>
            )}
          </Card.Body>
        </Collapse>
      </Card>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm mb-3">
            <Card.Header>Stage Actuel</Card.Header>
            <Card.Body>
              {currentStage ? (
                <>
                  <p><strong>ID :</strong> {currentStage.identifiant_unique}</p>
                  <p><strong>Titre :</strong> {currentStage.titre}</p>
                  <p><strong>Entreprise :</strong> {currentStage.entreprise}</p>
                  <p><strong>Période :</strong> {new Date(currentStage.dateDebut).toLocaleDateString()} → {new Date(currentStage.dateFin).toLocaleDateString()}</p>
                  <p><strong>Encadrant Académique :</strong> {currentStage.acaPrenom} {currentStage.acaNom}</p>
                  <p><strong>Encadrant Professionnel :</strong> {currentStage.proPrenom} {currentStage.proNom}</p>
                </>
              ) : (
                <p className="text-muted">Aucun stage en cours.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        
      </Row>

      <Card className="mb-4 shadow-sm">
        <Card.Header>Proposer un Stage</Card.Header>
        <Card.Body>
          <Form>
            <Row className="mb-3"><Col><Form.Control placeholder="Sujet" name="sujet" value={form.sujet} onChange={handleChange} /></Col></Row>
            <Row className="mb-3"><Col><Form.Control placeholder="Objectifs" name="objectifs" value={form.objectifs} onChange={handleChange} /></Col></Row>
            <Row className="mb-3">
              <Col><Form.Control type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} /></Col>
              <Col><Form.Control type="date" name="dateFin" value={form.dateFin} onChange={handleChange} /></Col>
            </Row>
            <Row className="mb-3">
              <Col><Form.Control placeholder="Email Encadrant Académique" name="encadrantAcademique" value={form.encadrantAcademique} onChange={handleChange} /></Col>
              <Col><Form.Control placeholder="Email Encadrant Professionnel" name="encadrantProfessionnel" value={form.encadrantProfessionnel} onChange={handleChange} /></Col>
            </Row>
            <Button variant="primary" onClick={proposeStage}>Soumettre</Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Header>Soumettre un Rapport</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            {Object.keys(cibles).map(name => (
              <Form.Check key={name} type="checkbox" label={`Envoyer à ${name}`} name={name} checked={cibles[name]} onChange={handleCheckboxChange} />
            ))}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control type="file" accept=".pdf,.doc,.docx" onChange={e => setRapport(e.target.files[0])} />
          </Form.Group>
          <Button variant="primary" onClick={submitRapport}>Envoyer</Button>
        </Card.Body>
      </Card>
      <Col md={6}>
          <Card className="mb-4 shadow-sm">
  <Card.Header>Rapport soumis </Card.Header>
  <Card.Body>
    {rapportsHistoriques.length > 0 ? (
      <ul>
        {rapportsHistoriques.map((rapport, index) => (
          <li key={index}>
            <strong>{rapport.action || 'Soumission du rapport'} —</strong>{' '}
            {new Date(rapport.dateSoumission).toLocaleDateString()}&nbsp;
            {rapport.fichier && (
              <a
                href={`${API_URL}/uploads/${rapport.fichier}`}
                target="_blank"
                rel="noreferrer"
              >
                Voir le rapport
              </a>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-muted">Aucune action enregistrée.</p>
    )}
  </Card.Body>
</Card>

        </Col>

      <Card className="mb-4 shadow-sm">
        <Card.Header>Commentaires</Card.Header>
        <Card.Body>
          {commentaires.length > 0 ? (
            <ul>
              {commentaires.map((c, i) => (
                <li key={i}><strong>{new Date(c.date_envoi).toLocaleString()}:</strong> {c.commentaire}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Aucun commentaire</p>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow-sm">
        <Card.Header>Attestation</Card.Header>
        <Card.Body>
          <Button variant="success" className="me-2" onClick={fetchAttestation}>Vérifier</Button>
          <Button variant="outline-primary" onClick={downloadAttestation}>Télécharger</Button>
          {attestationUrl && (
            <p className="mt-3">
              <a href={attestationUrl} target="_blank" rel="noreferrer">Voir l’attestation en ligne</a>
            </p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default DashboardEtudiant;
