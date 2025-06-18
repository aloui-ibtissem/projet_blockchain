import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Alert, Button, Card, Collapse, Form, Spinner, ListGroup } from 'react-bootstrap';
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
  const [activeSection, setActiveSection] = useState('stage-actuel');

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
      setForm({
        sujet: '', objectifs: '', dateDebut: '', dateFin: '',
        encadrantAcademique: '', encadrantProfessionnel: ''
      });
      await Promise.all([fetchStage(), fetchStagesHistoriques(), fetchNotifications()]);
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

  return (
    <div className="dashboard-wrapper">
      <div className="header-container">Étudiant</div>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <ul>
            <li><button className={activeSection === 'stage-actuel' ? 'active' : ''} onClick={() => setActiveSection('stage-actuel')}>Stage Actuel</button></li>
            <li><button className={activeSection === 'historique' ? 'active' : ''} onClick={() => setActiveSection('historique')}>Stages Historiques</button></li>
            <li><button className={activeSection === 'proposition' ? 'active' : ''} onClick={() => setActiveSection('proposition')}>Proposer Stage</button></li>
            <li><button className={activeSection === 'rapport' ? 'active' : ''} onClick={() => setActiveSection('rapport')}>Soumettre Rapport</button></li>
            <li><button className={activeSection === 'rapports-hist' ? 'active' : ''} onClick={() => setActiveSection('rapports-hist')}>Rapports Soumis</button></li>
            <li><button className={activeSection === 'attestation' ? 'active' : ''} onClick={() => setActiveSection('attestation')}>Attestation</button></li>
            <li><button className={activeSection === 'notifications' ? 'active' : ''} onClick={() => setActiveSection('notifications')}>Notifications</button></li>
          </ul>
        </aside>
        <main className="dashboard-main">
          {loading ? <Spinner animation="border" /> : (
            <div className="dashboard-section">
              {message && <Alert variant="info">{message}</Alert>}
              {activeSection === 'stage-actuel' && (
                <Card className="dashboard-card">
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
                    ) : <p className="text-muted">Aucun stage en cours.</p>}
                  </Card.Body>
                </Card>
              )}
              {activeSection === 'historique' && (
                <Card className="dashboard-card">
                  <Card.Header>Stages Historiques</Card.Header>
                  <Card.Body>
                    {stagesHistoriques.length > 0 ? (
                      <ListGroup>
                        {stagesHistoriques.map((s, i) => (
                          <ListGroup.Item key={i}>
                            <strong>{s.identifiant_unique}</strong> — {s.titre} — {s.entreprise}<br />
                            <small>Période : {new Date(s.dateDebut).toLocaleDateString()} → {new Date(s.dateFin).toLocaleDateString()}</small><br />
                            {s.identifiantRapport && (
                              <a href={`${BASE}/uploads/${s.fichier}`} target="_blank" rel="noreferrer">Voir le rapport</a>
                            )}
                            {s.ipfsUrl && (
                              <>
                                {" | "}
                                <a href={s.ipfsUrl} target="_blank" rel="noreferrer">Voir l’attestation</a>
                              </>
                            )}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : <p className="text-muted">Aucun stage historique.</p>}
                  </Card.Body>
                </Card>
              )}
              {activeSection === 'proposition' && (
                <Card className="dashboard-card">
                  <Card.Header>Proposer un Stage</Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Control className="mb-2" placeholder="Sujet" name="sujet" value={form.sujet} onChange={handleChange} />
                      <Form.Control className="mb-2" placeholder="Objectifs" name="objectifs" value={form.objectifs} onChange={handleChange} />
                      <div className="d-flex gap-2 mb-2">
                        <Form.Control type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} />
                        <Form.Control type="date" name="dateFin" value={form.dateFin} onChange={handleChange} />
                      </div>
                      <Form.Control className="mb-2" placeholder="Email Encadrant Académique" name="encadrantAcademique" value={form.encadrantAcademique} onChange={handleChange} />
                      <Form.Control className="mb-2" placeholder="Email Encadrant Professionnel" name="encadrantProfessionnel" value={form.encadrantProfessionnel} onChange={handleChange} />
                      <Button onClick={proposeStage}>Soumettre</Button>
                    </Form>
                  </Card.Body>
                </Card>
              )}
              {activeSection === 'rapport' && (
                <Card className="dashboard-card">
                  <Card.Header>Soumettre un Rapport</Card.Header>
                  <Card.Body>
                    <Form>
                      {Object.keys(cibles).map(name => (
                        <Form.Check key={name} type="checkbox" label={`Envoyer à ${name}`} name={name} checked={cibles[name]} onChange={handleCheckboxChange} />
                      ))}
                      <Form.Control className="mt-2 mb-2" type="file" accept=".pdf,.doc,.docx" onChange={e => setRapport(e.target.files[0])} />
                      <Button onClick={submitRapport}>Envoyer</Button>
                    </Form>
                  </Card.Body>
                </Card>
              )}
              {activeSection === 'rapports-hist' && (
                <Card className="dashboard-card">
                  <Card.Header>Rapports Soumis</Card.Header>
                  <Card.Body>
                    {rapportsHistoriques.length > 0 ? (
                      <ListGroup>
                        {rapportsHistoriques.map((r, i) => (
                          <ListGroup.Item key={i}>
                            <strong>{r.identifiantRapport}</strong> — {r.titre} —{" "}
                            <a href={`${BASE}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">Voir PDF</a>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : <p className="text-muted">Aucun rapport soumis.</p>}
                  </Card.Body>
                </Card>
              )}
              {activeSection === 'attestation' && (
                <Card className="dashboard-card">
                  <Card.Header>Attestation</Card.Header>
                  <Card.Body>
                    <Button onClick={fetchAttestation}>Vérifier</Button>
                    {attestationUrl && (
                      <div className="mt-2">
                        <a href={attestationUrl} target="_blank" rel="noreferrer">Voir l’attestation</a>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
              {activeSection === 'notifications' && (
                <Card className="dashboard-card">
                  <Card.Header>
                    Notifications
                    <Button variant="outline-light" size="sm" className="float-end" onClick={() => setShowNotif(!showNotif)}>
                      {showNotif ? "Masquer" : "Afficher"}
                    </Button>
                  </Card.Header>
                  <Collapse in={showNotif}>
                    <Card.Body>
                      {notifications.length > 0 ? (
                        notifications.map((n, i) => (
                          <div key={i}>
                            <strong>{n.message}</strong>
                            <small className="notification-date"> ({new Date(n.date_envoi).toLocaleDateString()})</small>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">Aucune notification</p>
                      )}
                    </Card.Body>
                  </Collapse>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardEtudiant;
