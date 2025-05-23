import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Card, Button, Alert, Row, Col,
  ListGroup, Form, Modal
} from 'react-bootstrap';
import './DashboardRespEntreprise.css';

const API_URL = 'http://localhost:3000';

function DashboardRespEntreprise() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [stagiaires, setStagiaires] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [formData, setFormData] = useState({
    appreciation: '',
    responsableNom: '',
    etudiant: '',
    titre: '',
    encadrants: '',
    dates: '',
    lieu: '',
    headerText: '',
    logoPath: '',
    signature: ''
  });

  useEffect(() => {
    if (!token || role !== 'ResponsableEntreprise') {
      navigate('/login');
      return;
    }

    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      navigate('/login');
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/entreprises/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStagiaires(res.data.stagiaires || []);
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
      setMessage('Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  const openForm = async (stageId) => {
    setSelectedStageId(stageId);
    try {
      const res = await axios.get(`${API_URL}/api/stage/details/${stageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stage = res.data;
      setFormData({
        appreciation: '',
        responsableNom: '',
        etudiant: `${stage.etudiantPrenom} ${stage.etudiantNom}`,
        titre: stage.titre,
        encadrants: `${stage.acaPrenom} ${stage.acaNom} / ${stage.proPrenom} ${stage.proNom}`,
        dates: `${new Date(stage.dateDebut).toLocaleDateString()} - ${new Date(stage.dateFin).toLocaleDateString()}`,
        lieu: '',
        headerText: '',
        logoPath: '',
        signature: ''
      });
      setShowModal(true);
    } catch (error) {
      console.error("Erreur chargement détails stage:", error);
      alert("Impossible de charger les détails du stage.");
    }
  };

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/attestation/generer/${selectedStageId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Attestation générée avec succès !\nHash: ${res.data.hash}`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de l'attestation.");
    }
  };

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">Tableau de bord Responsable Entreprise</h2>
      {message && <Alert variant="danger">{message}</Alert>}

      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header>Stagiaires validés</Card.Header>
            <ListGroup variant="flush">
              {stagiaires.length > 0 ? stagiaires.map(stag => (
                <ListGroup.Item key={stag.stageId}>
                  <strong>{stag.prenom} {stag.nom}</strong> — {stag.email}
                  <Button
                    variant="success"
                    className="float-end"
                    size="sm"
                    onClick={() => openForm(stag.stageId)}
                  >
                    Générer Attestation
                  </Button>
                </ListGroup.Item>
              )) : <ListGroup.Item>Aucun stagiaire à traiter.</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Header>Notifications</Card.Header>
            <ListGroup variant="flush">
              {notifications.length > 0 ? notifications.map(n => (
                <ListGroup.Item key={n.id}>
                  {n.message}<br />
                  <small className="text-muted">{new Date(n.date_envoi).toLocaleString()}</small>
                </ListGroup.Item>
              )) : <ListGroup.Item>Aucune notification</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Formulaire Attestation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Étudiant</Form.Label>
              <Form.Control type="text" value={formData.etudiant} readOnly />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Titre</Form.Label>
              <Form.Control type="text" value={formData.titre} readOnly />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Encadrants</Form.Label>
              <Form.Control type="text" value={formData.encadrants} readOnly />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Dates</Form.Label>
              <Form.Control type="text" value={formData.dates} readOnly />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Nom du Responsable</Form.Label>
              <Form.Control type="text" name="responsableNom" value={formData.responsableNom} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Lieu</Form.Label>
              <Form.Control type="text" name="lieu" value={formData.lieu} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>En-tête personnalisé</Form.Label>
              <Form.Control type="text" name="headerText" value={formData.headerText} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Logo (chemin local)</Form.Label>
              <Form.Control type="text" name="logoPath" value={formData.logoPath} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Signature numérique</Form.Label>
              <Form.Control type="text" name="signature" value={formData.signature} onChange={handleChange} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Appréciation</Form.Label>
              <Form.Control as="textarea" name="appreciation" rows={3} value={formData.appreciation} onChange={handleChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit}>Générer</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default DashboardRespEntreprise;
