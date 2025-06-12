import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Alert } from "react-bootstrap";
import "./DashboardTierEnt.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

function TierEntDashboard() {
  const [rapports, setRapports] = useState({ enAttente: [], valides: [] });
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRapports();
    fetchNotifications();
  }, []);

  const fetchRapports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/rapport/tier/rapports-assignes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRapports(res.data || { enAttente: [], valides: [] });
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors du chargement des rapports.");
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications/mes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const validerRapport = async (id) => {
    if (!window.confirm("Confirmez-vous la validation de ce rapport ?")) return;
    try {
      await axios.post(`${API_URL}/api/rapport/valider-tier`, {
        rapportId: id,
        structureType: "entreprise",
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Rapport validé avec succès.");
      fetchRapports();
    } catch (err) {
      console.error(err);
      setMessage("Échec lors de la validation.");
    }
  };

  const renderRapport = (r, isHistorique) => (
    <div key={r.id} className={`dashboard-card p-3 mb-3 shadow-sm border rounded ${isHistorique ? "bg-light" : ""}`}>
      <h6><strong>{r.identifiantRapport}</strong> — {r.titre}</h6>
      <p className="mb-1">Etudiant : {r.prenomEtudiant} {r.nomEtudiant}</p>
      <p className="mb-1">Date de fin : {new Date(r.dateFin).toLocaleDateString()}</p>
      <p className="mb-1">Soumis le : {new Date(r.dateSoumission).toLocaleDateString()}</p>
      <a href={`${API_URL}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">Voir le fichier PDF</a>
      {!isHistorique && (
        <div className="mt-2">
          <Button variant="success" size="sm" onClick={() => validerRapport(r.id)}>
            Valider ce rapport
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-tier">
      <div className="dashboard-header">
        <h5>Tableau de bord — Tier Entreprise</h5>
      </div>

      {message && <Alert variant="info">{message}</Alert>}
      {notifications.length > 0 && (
        <Alert variant="warning">
          Vous avez {notifications.length} nouvelle(s) notification(s).
        </Alert>
      )}

      <div className="mt-4">
        <h5 className="mb-3">Rapports à valider</h5>
        {rapports.enAttente.length === 0 ? (
          <p className="text-muted">Aucun rapport en attente.</p>
        ) : (
          rapports.enAttente.map(r => renderRapport(r, false))
        )}
      </div>

      <div className="mt-5">
        <h5 className="mb-3">Rapports validés</h5>
        {rapports.valides.length === 0 ? (
          <p className="text-muted">Aucun rapport validé.</p>
        ) : (
          rapports.valides.map(r => renderRapport(r, true))
        )}
      </div>
    </div>
  );
}

export default TierEntDashboard;
