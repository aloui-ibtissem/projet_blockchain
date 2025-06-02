import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Alert } from "react-bootstrap";
import "./DashboardTierEnt.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

function TierEntDashboard() {
  const [rapports, setRapports] = useState([]);
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
      if (Array.isArray(res.data)) {
        setRapports(res.data);
      } else {
        setRapports([]);
        console.warn("Format inattendu:", res.data);
      }
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
      setNotifications(res.data || []);
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

  return (
    <div className="dashboard-tier">
      <div className="dashboard-header">
        <h5>Tableau de bord — Tier Université</h5>
      </div>

      {message && <Alert variant="info">{message}</Alert>}
      {notifications.length > 0 && (
        <Alert variant="warning">
          Vous avez {notifications.length} nouvelle(s) notification(s).
        </Alert>
      )}

      {/*  Rapports à valider */}
      <div className="mt-4">
        <h5 className="mb-3"> Rapports à valider</h5>
        {rapports.filter(r => !r.statutProfessionnel).length === 0 ? (
          <p className="text-muted">Aucun rapport en attente.</p>
        ) : (
          rapports.filter(r => !r.statutProfessionnel).map((r) => (
            <div key={r.id} className="dashboard-card p-3 mb-3 shadow-sm border rounded">
              <h6><strong>{r.identifiantRapport}</strong> — {r.titre}</h6>
              <p className="mb-1">Étudiant : {r.prenomEtudiant} {r.nomEtudiant}</p>
              <p className="mb-1">Date de fin : {new Date(r.dateFin).toLocaleDateString()}</p>
              <p className="mb-1">Soumis le : {new Date(r.dateSoumission).toLocaleDateString()}</p>
              <a href={`${API_URL}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">
                Voir le fichier PDF
              </a>
              <div className="mt-2">
                <Button variant="success" size="sm" onClick={() => validerRapport(r.id)}>
                   Valider ce rapport
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/*  Historique */}
      <div className="mt-5">
        <h5 className="mb-3"> Rapports validés</h5>
        {rapports.filter(r => r.statutProfessionnel).length === 0 ? (
          <p className="text-muted">Aucun rapport validé.</p>
        ) : (
          rapports.filter(r => r.statutProfessionnel).map((r) => (
            <div key={r.id} className="dashboard-card p-3 mb-3 shadow-sm border rounded bg-light">
              <strong>{r.identifiantRapport}</strong> — {r.titre}<br />
              <a href={`${API_URL}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">
                Voir le PDF
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TierEntDashboard;
