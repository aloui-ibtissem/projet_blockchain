import React, { useEffect, useState } from 'react';
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
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Tableau de Bord Étudiant</h2>
      {message && <div className="mb-4 p-3 rounded bg-blue-100 text-blue-800">{message}</div>}

      {/* Notifications */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <button onClick={() => setShowNotif(!showNotif)} className="text-sm text-blue-600 hover:underline">
            {showNotif ? 'Masquer' : 'Afficher'} ({notifications.length})
          </button>
        </div>
        {showNotif && (
          <ul className="mt-3 max-h-40 overflow-y-auto text-sm text-gray-700">
            {notifications.length > 0 ? notifications.map(n => (
              <li key={n.id} className="mb-2 border-b pb-1">
                <strong>{n.message}</strong> <span className="text-xs text-gray-400">({new Date(n.date_envoi).toLocaleDateString()})</span>
              </li>
            )) : <li className="text-gray-500">Aucune notification</li>}
          </ul>
        )}
      </div>

      {/* Stage Actuel */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Stage Actuel</h3>
        {currentStage ? (
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>ID :</strong> {currentStage.identifiant_unique}</p>
            <p><strong>Titre :</strong> {currentStage.titre}</p>
            <p><strong>Entreprise :</strong> {currentStage.entreprise}</p>
            <p><strong>Période :</strong> {new Date(currentStage.dateDebut).toLocaleDateString()} → {new Date(currentStage.dateFin).toLocaleDateString()}</p>
            <p><strong>Encadrant Académique :</strong> {currentStage.acaPrenom} {currentStage.acaNom}</p>
            <p><strong>Encadrant Professionnel :</strong> {currentStage.proPrenom} {currentStage.proNom}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucun stage en cours.</p>
        )}
      </div>

      {/* Rapports soumis */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Rapports soumis</h3>
        {rapportsHistoriques.length > 0 ? (
          <ul className="text-sm text-gray-700 list-disc list-inside">
            {rapportsHistoriques.map((r, i) => (
              <li key={i}><strong>{r.identifiantRapport}</strong> — {new Date(r.dateSoumission).toLocaleDateString()}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Aucun rapport soumis.</p>
        )}
      </div>

      {/* Proposer un Stage */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Proposer un Stage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input className="border p-2 rounded" name="sujet" value={form.sujet} onChange={handleChange} placeholder="Sujet" />
          <input className="border p-2 rounded" name="objectifs" value={form.objectifs} onChange={handleChange} placeholder="Objectifs" />
          <input className="border p-2 rounded" type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} />
          <input className="border p-2 rounded" type="date" name="dateFin" value={form.dateFin} onChange={handleChange} />
          <input className="border p-2 rounded" name="encadrantAcademique" value={form.encadrantAcademique} onChange={handleChange} placeholder="Email Encadrant Académique" />
          <input className="border p-2 rounded" name="encadrantProfessionnel" value={form.encadrantProfessionnel} onChange={handleChange} placeholder="Email Encadrant Professionnel" />
        </div>
        <button onClick={proposeStage} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Soumettre</button>
      </div>

      {/* Soumettre un Rapport */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Soumettre un Rapport</h3>
        <div className="mb-3 space-y-2">
          {Object.keys(cibles).map(name => (
            <label key={name} className="block">
              <input type="checkbox" name={name} checked={cibles[name]} onChange={handleCheckboxChange} className="mr-2" />
              Envoyer à {name}
            </label>
          ))}
        </div>
        <input type="file" accept=".pdf,.doc,.docx" onChange={e => setRapport(e.target.files[0])} className="mb-4" />
        <button onClick={submitRapport} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Envoyer</button>
      </div>

      {/* Commentaires */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Commentaires</h3>
        {commentaires.length > 0 ? (
          <ul className="text-sm text-gray-700 space-y-1">
            {commentaires.map((c, i) => (
              <li key={i}><strong>{new Date(c.date_envoi).toLocaleString()}:</strong> {c.commentaire}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Aucun commentaire</p>
        )}
      </div>

      {/* Attestation */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Attestation</h3>
        <div className="flex space-x-4 mb-2">
          <button onClick={fetchAttestation} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Vérifier</button>
          <button onClick={downloadAttestation} className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50">Télécharger</button>
        </div>
        {attestationUrl && (
          <p className="text-sm mt-2">
            <a href={attestationUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Voir l’attestation en ligne</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default DashboardEtudiant;
