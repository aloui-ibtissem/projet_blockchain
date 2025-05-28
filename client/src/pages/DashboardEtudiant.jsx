import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Row, Col, Card, Button, Form, Alert, Collapse, Spinner
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
  const [stagesHistoriques, setStagesHistoriques] = useState(true);

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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCheckboxChange = (e) =>
    setCibles({ ...cibles, [e.target.name]: e.target.checked });

  const proposeStage = async () => {
    try {
      setMessage('Envoi de la proposition...');
      await axios.post(`${API_URL}/stage/proposer`, form, {
        headers: { Authorization: `Bearer ${token}`,
        withCredentials: true
 }
      });
      setMessage('Stage proposé avec succès.');
      await fetchStage();
    } catch (err) {
      setMessage("Erreur lors de la proposition du stage.");
    }
  };

  const submitRapport = async () => {
    if (!rapport) return setMessage("Veuillez sélectionner un fichier.");
    const destinataires = Object.keys(cibles).filter(k => cibles[k]);
    if (destinataires.length === 0)
      return setMessage("Veuillez cocher au moins un encadrant.");

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
      await fetchStage();
    } catch (err) {
      setMessage("Erreur lors de la soumission du rapport.");
    }
  };

  const fetchStage = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/mon-stage`, {
        headers: { Authorization: `Bearer ${token}`,
        withCredentials: true
 }
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
        headers: { Authorization: `Bearer ${token}`,
        withCredentials: true
 }
      });
      setCommentaires(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCommentaires([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/notifications`, {
        headers: { Authorization: `Bearer ${token}`,
        withCredentials: true
 }
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNotifications([]);
    }
  };

  const fetchMesRapports = async () => {
    try {
      await axios.get(`${API_URL}/rapport/mes-rapports`, {
        headers: { Authorization: `Bearer ${token}`,
        withCredentials: true
 }
      });
    } catch {
      // No action, silent failure
    }
  };

  const fetchAttestation = async () => {
    try {
      const res = await axios.get(`${API_URL}/attestation/etudiant/ma-attestation`, {
        headers: { Authorization: `Bearer ${token}`,
        withCredentials: true
 }
      });
      setAttestationUrl(res.data.attestationUrl || '');
    } catch {
      setMessage("Aucune attestation disponible.");
    }
  };


  const downloadAttestation = async () => {
    try {
      const res = await axios.get(`${API_URL}/attestation/download`, {
        headers: { Authorization: `Bearer ${token}`,
        withCredentials: true
 },
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


  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Espace Étudiant</h2>
      {message && <Alert variant="info">{message}</Alert>}

      {/* Notifications */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="d-flex justify-content-between">
          Notifications
          <Button size="sm" onClick={() => setShowNotif(!showNotif)} variant="outline-primary">
            {showNotif ? "Masquer" : "Afficher"}
          </Button>
        </Card.Header>
        <Collapse in={showNotif}>
          <Card.Body style={{ maxHeight: 180, overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              <ul className="mb-0">
                {notifications.map(n => (
                  <li key={n.id}>
                    {n.message}{' '}
                    <small className="text-muted">({new Date(n.date_envoi).toLocaleDateString()})</small>
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
      <Card className="mb-4 shadow-sm">
  <Card.Header>Stage Actuel</Card.Header>
  <Card.Body>
    {currentStage ? (
      <>
        <p><strong>ID :</strong> {currentStage.identifiant_unique}</p>
        <p><strong>Titre :</strong> {currentStage.titre}</p>
        <p><strong>Entreprise :</strong> {currentStage.entreprise}</p>
        <p><strong>Période :</strong> {new Date(currentStage.dateDebut).toLocaleDateString()} → {new Date(currentStage.dateFin).toLocaleDateString()}</p>
        <p><strong>Encadrant Académique :</strong> {currentStage.acaPrenom} {currentStage.acaNom} ({currentStage.acaEmail})</p>
        <p><strong>Encadrant Professionnel :</strong> {currentStage.proPrenom} {currentStage.proNom} ({currentStage.proEmail})</p>
      </>
    ) : (
      <p className="text-muted">Aucun stage en cours. Vous pouvez proposer un nouveau sujet.</p>
    )}
  </Card.Body>
</Card>
<Card className="mb-4 shadow-sm">
  <Card.Header>Stages Précédents</Card.Header>
  <Card.Body>
    {stagesHistoriques.length > 0 ? (
      <ul>
        {stagesHistoriques.map((s) => (
          <li key={s.id}>
            <strong>{s.titre}</strong> à {s.entreprise} —
            {new Date(s.dateDebut).toLocaleDateString()} → {new Date(s.dateFin).toLocaleDateString()}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-muted">Aucun stage validé pour le moment.</p>
    )}
  </Card.Body>
</Card>



      {/* Proposition de stage */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Proposition de Stage</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Control placeholder="Sujet" name="sujet" value={form.sujet} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control placeholder="Objectifs" name="objectifs" value={form.objectifs} onChange={handleChange} />
            </Form.Group>
            <Row className="mb-2">
              <Col><Form.Control type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} /></Col>
              <Col><Form.Control type="date" name="dateFin" value={form.dateFin} onChange={handleChange} /></Col>
            </Row>
            <Row className="mb-2">
              <Col><Form.Control placeholder="Email Encadrant Académique" name="encadrantAcademique" value={form.encadrantAcademique} onChange={handleChange} /></Col>
              <Col><Form.Control placeholder="Email Encadrant Professionnel" name="encadrantProfessionnel" value={form.encadrantProfessionnel} onChange={handleChange} /></Col>
            </Row>
            <Button variant="primary" onClick={proposeStage}>Soumettre</Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Soumettre rapport */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Soumettre le Rapport</Card.Header>
        <Card.Body>
          <Form.Group className="mb-2">
            {Object.keys(cibles).map(name => (
              <Form.Check
                key={name}
                type="checkbox"
                label={`Envoyer à l'${name.toLowerCase()}`}
                name={name}
                checked={cibles[name]}
                onChange={handleCheckboxChange}
              />
            ))}
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Control type="file" accept=".pdf,.doc,.docx" onChange={e => setRapport(e.target.files[0])} />
          </Form.Group>
          <Button variant="primary" onClick={submitRapport}>Envoyer</Button>
        </Card.Body>
      </Card>

      {/* Commentaires */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>Commentaires</Card.Header>
        <Card.Body>
          {commentaires.length > 0 ? (
            <ul>
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
        <Card.Header>Attestation de Stage</Card.Header>
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
