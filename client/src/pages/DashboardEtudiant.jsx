// ✅ Version améliorée du Dashboard Étudiant avec sidebar fonctionnelle, logout, navigation interne et meilleur design
import React, { useEffect, useState, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
const API_URL = BASE.includes('/api') ? BASE : `${BASE}/api`;

function DashboardEtudiant() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [form, setForm] = useState({ sujet: '', objectifs: '', dateDebut: '', dateFin: '', encadrantAcademique: '', encadrantProfessionnel: '' });
  const [rapport, setRapport] = useState(null);
  const [cibles, setCibles] = useState({ EncadrantAcademique: false, EncadrantProfessionnel: false });
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [commentaires, setCommentaires] = useState([]);
  const [attestationUrl, setAttestationUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [stagesHistoriques, setStagesHistoriques] = useState([]);
  const [rapportsHistoriques, setRapportsHistoriques] = useState([]);

  // Refs for scrolling
  const refAccueil = useRef();
  const refRapports = useRef();
  const refProposition = useRef();
  const refAttestation = useRef();

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth' });

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    if (!token || role !== 'Etudiant') return navigate('/login');
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      logout();
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
      await axios.post(`${API_URL}/stage/proposer`, form, { headers: { Authorization: `Bearer ${token}`, withCredentials: true } });
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
      const res = await axios.get(`${API_URL}/stage/mon-stage`, { headers: { Authorization: `Bearer ${token}`, withCredentials: true } });
      setCurrentStage(res.data);
      if (res.data?.rapportId) fetchCommentaires(res.data.rapportId);
    } catch {
      setCurrentStage(null);
    }
  };

  const fetchCommentaires = async (rapportId) => {
    try {
      const res = await axios.get(`${API_URL}/rapport/commentaires/${rapportId}`, { headers: { Authorization: `Bearer ${token}`, withCredentials: true } });
      setCommentaires(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCommentaires([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/notifications`, { headers: { Authorization: `Bearer ${token}`, withCredentials: true } });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNotifications([]);
    }
  };

  const fetchMesRapports = async () => {
    try {
      const res = await axios.get(`${API_URL}/rapport/mes-rapports`, { headers: { Authorization: `Bearer ${token}` } });
      setRapportsHistoriques(res.data);
    } catch {
      setRapportsHistoriques([]);
    }
  };

  const fetchStagesHistoriques = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/historique`, { headers: { Authorization: `Bearer ${token}` } });
      setStagesHistoriques(res.data);
    } catch {
      setStagesHistoriques([]);
    }
  };

  const fetchAttestation = async () => {
    try {
      const res = await axios.get(`${API_URL}/attestation/etudiant/ma-attestation`, { headers: { Authorization: `Bearer ${token}`, withCredentials: true } });
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

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div></div>;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar-menu">
        <div className="menu-card">
          <button className="menu-item" onClick={() => scrollTo(refAccueil)}>Accueil</button>
          <button className="menu-item" onClick={() => scrollTo(refRapports)}>Mes Rapports</button>
          <button className="menu-item" onClick={() => scrollTo(refProposition)}>Proposer un Stage</button>
          <button className="menu-item" onClick={() => scrollTo(refAttestation)}>Attestation</button>
          <button className="menu-item logout-btn" onClick={logout}>Se Déconnecter</button>
        </div>
      </aside>
      <main className="dashboard-content">
        <header className="header">
          <h2 className="header-title">Tableau de Bord Étudiant</h2>
        </header>

        <div className="main-content">
          {message && <div className="mb-4 p-3 rounded bg-blue-100 text-blue-800">{message}</div>}

          <section ref={refAccueil} className="dashboard-card mb-6">
            <div className="card-header">Notifications ({notifications.length})</div>
            <div className="card-body">
              {showNotif && (
                <ul className="notification-list">
                  {notifications.length > 0 ? notifications.map(n => (
                    <li key={n.id}><strong>{n.message}</strong><span className="notification-date"> ({new Date(n.date_envoi).toLocaleDateString()})</span></li>
                  )) : <li className="text-muted">Aucune notification</li>}
                </ul>
              )}
              <button className="btn-outline-primary mt-2" onClick={() => setShowNotif(!showNotif)}>
                {showNotif ? 'Masquer' : 'Afficher'} les notifications
              </button>
            </div>
          </section>

          <section className="dashboard-card mb-6">
            <div className="card-header">Stage Actuel</div>
            <div className="card-body">
              {currentStage ? (
                <ul>
                  <li><strong>ID :</strong> {currentStage.identifiant_unique}</li>
                  <li><strong>Titre :</strong> {currentStage.titre}</li>
                  <li><strong>Entreprise :</strong> {currentStage.entreprise}</li>
                  <li><strong>Période :</strong> {new Date(currentStage.dateDebut).toLocaleDateString()} → {new Date(currentStage.dateFin).toLocaleDateString()}</li>
                  <li><strong>Encadrant Académique :</strong> {currentStage.acaPrenom} {currentStage.acaNom}</li>
                  <li><strong>Encadrant Professionnel :</strong> {currentStage.proPrenom} {currentStage.proNom}</li>
                </ul>
              ) : <p className="text-muted">Aucun stage en cours.</p>}
            </div>
          </section>

          <section ref={refRapports} className="dashboard-card mb-6">
            <div className="card-header">Rapports soumis</div>
            <div className="card-body">
              {rapportsHistoriques.length > 0 ? (
                <ul>
                  {rapportsHistoriques.map((r, i) => (
                    <li key={i}><strong>{r.identifiantRapport}</strong> — {new Date(r.dateSoumission).toLocaleDateString()}</li>
                  ))}
                </ul>
              ) : <p className="text-muted">Aucun rapport soumis.</p>}
            </div>
          </section>

          <section ref={refProposition} className="dashboard-card mb-6">
            <div className="card-header">Proposer un Stage</div>
            <div className="card-body">
              <div className="form-row"><input className="form-control" name="sujet" placeholder="Sujet" value={form.sujet} onChange={handleChange} /></div>
              <div className="form-row"><input className="form-control" name="objectifs" placeholder="Objectifs" value={form.objectifs} onChange={handleChange} /></div>
              <div className="form-row">
                <input className="form-control" type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} />
                <input className="form-control" type="date" name="dateFin" value={form.dateFin} onChange={handleChange} />
              </div>
              <div className="form-row">
                <input className="form-control" name="encadrantAcademique" placeholder="Email Encadrant Académique" value={form.encadrantAcademique} onChange={handleChange} />
                <input className="form-control" name="encadrantProfessionnel" placeholder="Email Encadrant Professionnel" value={form.encadrantProfessionnel} onChange={handleChange} />
              </div>
              <button className="btn-primary" onClick={proposeStage}>Soumettre</button>
            </div>
          </section>

          <section className="dashboard-card mb-6">
            <div className="card-header">Soumettre un Rapport</div>
            <div className="card-body">
              <div className="form-row">
                {Object.keys(cibles).map(name => (
                  <label key={name} className="flex items-center space-x-2">
                    <input type="checkbox" name={name} checked={cibles[name]} onChange={handleCheckboxChange} />
                    <span>Envoyer à {name}</span>
                  </label>
                ))}
              </div>
              <div className="form-row"><input type="file" accept=".pdf,.doc,.docx" className="form-control" onChange={e => setRapport(e.target.files[0])} /></div>
              <button className="btn-primary" onClick={submitRapport}>Envoyer</button>
            </div>
          </section>

          <section className="dashboard-card mb-6">
            <div className="card-header">Commentaires</div>
            <div className="card-body">
              {commentaires.length > 0 ? (
                <ul>
                  {commentaires.map((c, i) => (<li key={i}><strong>{new Date(c.date_envoi).toLocaleString()}:</strong> {c.commentaire}</li>))}
                </ul>
              ) : <p className="text-muted">Aucun commentaire</p>}
            </div>
          </section>

          <section ref={refAttestation} className="dashboard-card mb-6">
            <div className="card-header">Attestation</div>
            <div className="card-body">
              <div className="form-row">
                <button className="btn-primary" onClick={fetchAttestation}>Vérifier</button>
                <button className="btn-outline-primary ml-2" onClick={downloadAttestation}>Télécharger</button>
              </div>
              {attestationUrl && (
                <p className="mt-3"><a href={attestationUrl} target="_blank" rel="noreferrer">Voir l’attestation en ligne</a></p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default DashboardEtudiant;
