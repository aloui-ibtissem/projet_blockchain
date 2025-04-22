import React, { useEffect, useState } from "react";
import axios from "axios";
import "./DashboardRespUniversite.css";

function DashboardRespUniversitaire() {
  const [encadrants, setEncadrants] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/api/universite/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setEncadrants(res.data.encadrants || []);
      setEtudiants(res.data.etudiants || []);
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors du chargement des données.");
    }
  };

  return (
    <div className="dashboard-universite">
      <h2>Responsable Universitaire - Espace de Gestion</h2>

      {message && <div className="alert-error">{message}</div>}

      <section className="dashboard-section">
        <h3>Encadrants Académiques</h3>
        <ul>
          {encadrants.length === 0 ? (
            <li>Aucun encadrant disponible</li>
          ) : (
            encadrants.map((e) => (
              <li key={e.id}>
                {e.prenom} {e.nom} — <span>{e.email}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="dashboard-section">
        <h3>Étudiants Inscrits</h3>
        <ul>
          {etudiants.length === 0 ? (
            <li>Aucun étudiant trouvé</li>
          ) : (
            etudiants.map((e) => (
              <li key={e.id}>
                {e.prenom} {e.nom} — <span>{e.email}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="dashboard-section">
        <h3>Notifications Récentes</h3>
        <ul>
          {notifications.length === 0 ? (
            <li>Aucune notification</li>
          ) : (
            notifications.map((n) => (
              <li key={n.id}>
                <strong>{n.message}</strong> <span className="notif-date">{new Date(n.date_envoi).toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

export default DashboardRespUniversitaire;
