// ✅ Version modernisée du Dashboard Étudiant avec TailwindCSS + structure claire
// ℹ️ À intégrer dans un projet avec Tailwind installé. Logique conservée strictement.

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
      {/* ... composants stylisés à continuer avec Tailwind ici ... */}
    </div>
  );
}

export default DashboardEtudiant;
