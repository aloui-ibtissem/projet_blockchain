import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  Container, Card, Button, ListGroup, Form, Modal, Alert, Collapse, Spinner, Badge
} from 'react-bootstrap';
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
  const [historique, setHistorique] = useState([]);
  const [rapportsValidés, setRapportsValidés] = useState([]);
  const [encadrantsPro, setEncadrantsPro] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

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
      const headers = { Authorization: `Bearer ${token}` };

      const [stagiairesRes, infoRes, histRes, rapValRes, encadrantsRes] = await Promise.all([
        axios.get(`${API_URL}/stage/resp-ent/stagiaires`, { headers }),
        axios.get(`${API_URL}/entreprises/info`, { headers }),
        axios.get(`${API_URL}/historique/mes`, { headers }),
        axios.get(`${API_URL}/rapport/entreprise/valides`, { headers }),
        axios.get(`${API_URL}/stage/resp-ent/encadrants`, { headers })
      ]);

      const info = infoRes.data || {};
      const nomComplet = `${info.responsablePrenom || ''} ${info.responsableNom || ''}`.trim();

      setStagiaires(Array.isArray(stagiairesRes.data) ? stagiairesRes.data : []);
      setNotifications(Array.isArray(info.notifications) ? info.notifications : []);
      setHistorique(Array.isArray(histRes.data) ? histRes.data : []);
      setRapportsValidés(Array.isArray(rapValRes.data) ? rapValRes.data : []);
      setEncadrantsPro(Array.isArray(encadrantsRes.data) ? encadrantsRes.data : []);

      setFormData(prev => ({
        ...prev,
        responsableNom: nomComplet,
        lieu: info.entrepriseNom || '',
        logoPath: info.logoPath || ''
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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
          <Container className="mt-4 dashboard-etudiant">
            <h2 className="text-center mb-4">Tableau de Bord Responsable Entreprise</h2>
            {message && <Alert variant="danger">{message}</Alert>}
            {loading ? (
              <div className="text-center"><Spinner animation="border" /></div>
            ) : (
              <>
                {/* Notifications */}
                <Card className="mb-4 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    Notifications <Badge bg="secondary">{notifications.length}</Badge>
                    <Button size="sm" variant="outline-primary" onClick={() => setShowNotif(!showNotif)}>
                      {showNotif ? "Masquer" : "Afficher"}
                    </Button>
                  </Card.Header>
                  <Collapse in={showNotif}>
                    <Card.Body style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {notifications.length > 0 ? (
                        <ul className="notification-list">
                          {notifications.map((n, i) => (
                            <li key={i}>
                              <strong>{n.message}</strong>
                              <small className="notification-date"> ({new Date(n.date_envoi).toLocaleString()})</small>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-muted">Aucune notification</p>}
                    </Card.Body>
                  </Collapse>
                </Card>

                {/* Stagiaires à traiter */}
                <Card className="mb-4 shadow-sm">
                  <Card.Header>Stagiaires à générer leurs attestations</Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush">
                      {stagiaires.length > 0 ? stagiaires.map(stag => (
                        <ListGroup.Item key={stag.stageId}>
                          <strong>{stag.prenom} {stag.nom}</strong> — {stag.email}
                          <Button variant="success" className="float-end" size="sm" onClick={() => openForm(stag.stageId)}>
                            Générer Attestation
                          </Button>
                        </ListGroup.Item>
                      )) : <ListGroup.Item>Aucun stagiaire à traiter.</ListGroup.Item>}
                    </ListGroup>
                  </Card.Body>
                </Card>

                {/* Liste des stagiaires */}
                <Card className="mb-4 shadow-sm">
                  <Card.Header>Stagiaires</Card.Header>
                  <Card.Body>
                    {stagiaires.length > 0 ? (
                      <ListGroup>
                        {stagiaires.map((stag, i) => (
                          <ListGroup.Item key={i}>
                            <strong>{stag.prenom} {stag.nom}</strong> — {stag.email}<br />
                            <em>{stag.titre}</em><br />
                            <span>Encadrant Académique : <strong>{stag.acaPrenom} {stag.acaNom}</strong></span><br />
                            <span>Encadrant Professionnel : <strong>{stag.proPrenom} {stag.proNom}</strong></span>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : <p className="text-muted">Aucun stagiaire assigné.</p>}
                  </Card.Body>
                </Card>

                {/* Encadrants professionnels */}
                <Card className="mb-4 shadow-sm">
                  <Card.Header>Encadrants Professionnels</Card.Header>
                  <Card.Body>
                    {encadrantsPro.length > 0 ? (
                      <ListGroup>
                        {encadrantsPro.map(enc => (
                          <ListGroup.Item key={enc.id}>
                            <strong>{enc.nom} {enc.prenom}</strong> — {enc.email}<br />
                            ID : {enc.identifiant_unique} | Stagiaires : {enc.nombreStagiaires}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : <p className="text-muted">Aucun encadrant professionnel trouvé.</p>}
                  </Card.Body>
                </Card>
              </>
            )}
          </Container>
        </main>
      </div>

      {/* Modal Attestation */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Formulaire Attestation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploadSuccess && <Alert variant="success">{uploadSuccess}</Alert>}
          <Form>
            {[
              { label: "Étudiant", name: "etudiant", readonly: true },
              { label: "Titre", name: "titre", readonly: true },
              { label: "Encadrants", name: "encadrants", readonly: true },
              { label: "Dates", name: "dates", readonly: true },
              { label: "Nom du Responsable", name: "responsableNom" },
              { label: "Lieu", name: "lieu" },
              { label: "En-tête personnalisé", name: "headerText" },
              { label: "Signature numérique", name: "signature" }
            ].map(({ label, name, readonly }) => (
              <Form.Group className="mb-2" key={name}>
                <Form.Label>{label}</Form.Label>
                <Form.Control
                  type="text"
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  readOnly={readonly}
                />
              </Form.Group>
            ))}
            <Form.Group className="mb-2">
              <Form.Label>Logo (chemin local)</Form.Label>
              <Form.Control type="text" name="logoPath" value={formData.logoPath} readOnly />
              <Form.Control type="file" accept="image/*" onChange={handleLogoUpload} className="mt-1" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Appréciation</Form.Label>
              <Form.Control
                as="textarea"
                name="appreciation"
                rows={3}
                value={formData.appreciation}
                onChange={handleChange}
              />
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
