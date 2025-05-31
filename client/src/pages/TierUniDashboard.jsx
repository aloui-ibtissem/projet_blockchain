import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Alert } from "react-bootstrap";
import "../styles/DashboardTierUni.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

function TierUniDashboard() {
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
      const res = await axios.get(`${API_URL}/api/rapport/tiers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRapports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications/mes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const validerRapport = async (id) => {
    if (!window.confirm("Confirmez-vous la validation de ce rapport ?")) return;
    try {
      await axios.post(
        `${API_URL}/api/rapport/valider-tier`,
        {
          rapportId: id,
          structureType: "universite",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage(" Rapport validé avec succès.");
      fetchRapports();
    } catch (err) {
      console.error(err);
      setMessage(" Échec lors de la validation.");
    }
  };

  return (
    <div className="dashboard-tier">
      <h2>Tableau de bord - Tiers Université</h2>
      {message && <Alert variant="info">{message}</Alert>}
      {notifications.length > 0 && (
        <Alert variant="warning">
           Vous avez {notifications.length} nouvelle(s) notification(s).
        </Alert>
      )}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID Rapport</th>
            <th>Étudiant</th>
            <th>Titre</th>
            <th>Période</th>
            <th>Soumission</th>
            <th>Fichier</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rapports.map((r) => (
            <tr key={r.id}>
              <td>{r.identifiantRapport}</td>
              <td>{r.prenomEtudiant} {r.nomEtudiant}</td>
              <td>{r.titre}</td>
              <td>{new Date(r.dateFin).toLocaleDateString()}</td>
              <td>{new Date(r.dateSoumission).toLocaleDateString()}</td>
              <td>
                <a href={`${API_URL}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">
                  Voir
                </a>
              </td>
              <td>
                <Button variant="success" onClick={() => validerRapport(r.id)}>
                  Valider
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default TierUniDashboard;
