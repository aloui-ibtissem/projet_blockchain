import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import { Alert, Card, Button, ListGroup, Form, Modal } from 'react-bootstrap';
import './DashboardRespEntreprise.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function DashboardRespEntreprise() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [stagiaires, setStagiaires] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
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
  }, [navigate, token, role]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, infoRes] = await Promise.all([
        axios.get(`${API_URL}/entreprises/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/entreprises/info`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const nomComplet = `${infoRes.data.responsablePrenom || ''} ${infoRes.data.responsableNom || ''}`.trim();

      setStagiaires(dashRes.data.stagiaires || []);
      setNotifications(dashRes.data.notifications || []);

      setFormData(prev => ({
        ...prev,
        responsableNom: nomComplet,
        lieu: infoRes.data.entrepriseNom || '',
        logoPath: infoRes.data.logoPath || ''
      }));
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
      setFormData(prev => ({
        ...prev,
        appreciation: '',
        etudiant: `${stage.etudiantPrenom} ${stage.etudiantNom}`,
        titre: stage.titre,
        encadrants: `${stage.acaPrenom} ${stage.acaNom} / ${stage.proPrenom} ${stage.proNom}`,
        dates: `${new Date(stage.dateDebut).toLocaleDateString()} - ${new Date(stage.dateFin).toLocaleDateString()}`
      }));
      setUploadSuccess('');
      setShowModal(true);
    } catch (error) {
      console.error("Erreur chargement détails stage:", error);
      alert("Impossible de charger les détails du stage.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataUpload = new FormData();
    formDataUpload.append("logo", file);
    try {
      const res = await axios.post(`${API_URL}/entreprises/upload-logo`, formDataUpload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(prev => ({ ...prev, logoPath: res.data.logoPath }));
      setUploadSuccess("Logo mis à jour avec succès !");
    } catch (err) {
      console.error(err);
      alert("Échec de l'upload du logo.");
    }
  };

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
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-content">
        <Header title="Responsable Entreprise" />
        <main className="main-content">
          {message && <Alert variant="danger">{message}</Alert>}
          {loading ? (
            <SkeletonLoader />
          ) : (
            <div className="dashboard-grid">
              <Card className="dashboard-card">
                <Card.Header>Stagiaires à générer leurs attestations</Card.Header>
                <Card.Body>
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
                </Card.Body>
              </Card>

              <Card className="dashboard-card">
                <Card.Header>Notifications</Card.Header>
                <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id}>
                      {n.message}
                      <span className="notification-date">
                        {new Date(n.date_envoi).toLocaleString()}
                      </span>
                    </div>
                  )) : <p className="text-muted">Aucune notification</p>}
                </Card.Body>
              </Card>
            </div>
          )}
        </main>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Formulaire Attestation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploadSuccess && <Alert variant="success">{uploadSuccess}</Alert>}
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
              <Form.Control type="text" name="logoPath" value={formData.logoPath} readOnly />
              <Form.Control type="file" accept="image/*" onChange={handleLogoUpload} className="mt-1" />
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
    </div>
  );
}

export default DashboardRespEntreprise;
