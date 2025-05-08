import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Collapse,
  Spinner
} from 'react-bootstrap';
import './DashboardEtudiant.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function DashboardEtudiant() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [form, setForm] = useState({
    sujet: '',
    objectifs: '',
    dateDebut: '',
    dateFin: '',
    encadrantAcademique: '',
    encadrantProfessionnel: ''
  });
  const [rapport, setRapport] = useState(null);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [commentaires, setCommentaires] = useState([]);
  const [attestationUrl, setAttestationUrl] = useState('');
  const [loading, setLoading] = useState(true);

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
    await Promise.all([fetchStage(), fetchNotifications(), fetchMesRapports()]);
    setLoading(false);
  };

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const proposeStage = async () => {
    try {
      setMessage('Envoi de la proposition...');
      await axios.post(
        `${API_URL}/api/stage/proposer`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Proposition envoyée avec succès !');
      await fetchStage();
    } catch (err) {
      setMessage('Erreur : ' + (err.response?.data?.error || err.message));
    }
  };

  const submitRapport = async () => {
    if (!rapport) return setMessage('Veuillez sélectionner un fichier.');
    const formData = new FormData();
    formData.append('fichier', rapport);
    try {
      await axios.post(
        `${API_URL}/api/rapport/soumettre`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setMessage('Rapport soumis avec succès !');
      await fetchStage();
    } catch (err) {
      setMessage('Erreur : ' + (err.response?.data?.error || err.message));
    }
  };
  const fetchMesRapports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/rapport/mes-rapports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Optionnel : mettre les rapports dans un state si besoin
    } catch (err) {
      console.error("Erreur chargement des rapports étudiant :", err);
    }
  };
  

  const fetchAttestation = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/stage/attestation`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttestationUrl(res.data.attestationUrl);
    } catch {
      setMessage('Aucune attestation disponible.');
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/stage/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(res.data);
    } catch {
      console.error('Erreur chargement notifications');
    }
  };

  const fetchStage = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/stage/mon-stage`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentStage(res.data);
      if (res.data?.rapportId) fetchCommentaires(res.data.rapportId);
    } catch {
      setCurrentStage(null);
    }
  };

  const fetchCommentaires = async rapportId => {
    try {
      const res = await axios.get(
        `${API_URL}/api/rapport/commentaires/${rapportId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentaires(res.data);
    } catch {
      setCommentaires([]);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center">Espace Étudiant</h2>
      {message && <Alert variant="info">{message}</Alert>}

      {/* Notifications */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Notifications</span>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowNotif(!showNotif)}
          >
            {showNotif ? 'Masquer' : 'Afficher'}
          </Button>
        </Card.Header>
        <Collapse in={showNotif}>
          <Card.Body style={{ maxHeight: 200, overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              <ul className="mb-0">
                {notifications.map(n => (
                  <li key={n.id}>
                    {n.message}{' '}
                    <small className="text-muted">
                      ({new Date(n.date_envoi).toLocaleDateString()})
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">Aucune notification</p>
            )}
          </Card.Body>
        </Collapse>
      </Card>

      {/* Stage en cours */}
      {currentStage && (
        <Card className="mb-4 shadow-sm">
          <Card.Header>Stage Actuel</Card.Header>
          <Card.Body>
            <p><strong>Identifiant :</strong> {currentStage.identifiant_unique}</p>
            <p><strong>Titre :</strong> {currentStage.titre}</p>
            <p><strong>Entreprise :</strong> {currentStage.entreprise}</p>
            <p><strong>Période :</strong> {new Date(currentStage.dateDebut).toLocaleDateString()} → {new Date(currentStage.dateFin).toLocaleDateString()}</p>
            <p><strong>Encadrant Académique :</strong> {currentStage.acaPrenom} {currentStage.acaNom} (<strong>{currentStage.acaEmail}</strong>)</p>
            <p><strong>Encadrant Professionnel :</strong> {currentStage.proPrenom} {currentStage.proNom} (<strong>{currentStage.proEmail}</strong>)</p>
          </Card.Body>
        </Card>
      )}

      {/* Proposition de Stage */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Proposition de Stage</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Control
                name="sujet"
                placeholder="Sujet du stage"
                value={form.sujet}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                name="objectifs"
                placeholder="Objectifs"
                value={form.objectifs}
                onChange={handleChange}
              />
            </Form.Group>
            <Row className="mb-2">
              <Col>
                <Form.Control
                  type="date"
                  name="dateDebut"
                  value={form.dateDebut}
                  onChange={handleChange}
                />
              </Col>
              <Col>
                <Form.Control
                  type="date"
                  name="dateFin"
                  value={form.dateFin}
                  onChange={handleChange}
                />
              </Col>
            </Row>
            <Row className="mb-2">
              <Col>
                <Form.Control
                  name="encadrantAcademique"
                  placeholder="Email Encadrant Académique"
                  value={form.encadrantAcademique}
                  onChange={handleChange}
                />
              </Col>
              <Col>
                <Form.Control
                  name="encadrantProfessionnel"
                  placeholder="Email Encadrant Professionnel"
                  value={form.encadrantProfessionnel}
                  onChange={handleChange}
                />
              </Col>
            </Row>
            <Button variant="primary" onClick={proposeStage}>
              Soumettre
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Soumission du rapport */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Soumettre le Rapport</Card.Header>
        <Card.Body>
          {currentStage && (
            <>
              <p>
                <strong>Destinataires :</strong><br />
                {currentStage.acaPrenom} {currentStage.acaNom} ({currentStage.acaEmail})<br />
                {currentStage.proPrenom} {currentStage.proNom} ({currentStage.proEmail})
              </p>
            </>
          )}
          <Form.Group className="mb-2">
            <Form.Control
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={e => setRapport(e.target.files[0])}
            />
          </Form.Group>
          <Button onClick={submitRapport}>Envoyer</Button>
        </Card.Body>
      </Card>

      {/* Commentaires */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Commentaires sur le Rapport</Card.Header>
        <Card.Body>
          {commentaires.length > 0 ? (
            <ul className="mb-0">
              {commentaires.map((c, i) => (
                <li key={i}>
                  <strong>{new Date(c.date_envoi).toLocaleString()}:</strong> {c.commentaire}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Aucun commentaire</p>
          )}
        </Card.Body>
      </Card>

      {/* Attestation */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Attestation de stage</Card.Header>
        <Card.Body>
          <Button variant="success" onClick={fetchAttestation}>
            Vérifier l’attestation
          </Button>
          {attestationUrl && (
            <p className="mt-2">
              <a href={attestationUrl} target="_blank" rel="noreferrer">
                Voir l’attestation
              </a>
            </p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default DashboardEtudiant;
