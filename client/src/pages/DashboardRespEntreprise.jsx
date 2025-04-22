import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./DashboardRespEntreprise.css";

function DashboardRespEntreprise() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [stagiaires, setStagiaires] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      if (!token || role !== "ResponsableEntreprise") {
        navigate("/login");
        return;
      }

      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        localStorage.clear();
        navigate("/login");
      }

      fetchDashboardData();
    } catch {
      localStorage.clear();
      navigate("/login");
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/entreprise/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStagiaires(res.data.stagiaires);
      setEmployes(res.data.employes);
      setNotifications(res.data.notifications);
    } catch (err) {
      setMessage("Erreur de chargement.");
    }
  };

  return (
    <div className="dashboard-entreprise">
      <h2>Dashboard Responsable d’Entreprise</h2>
      {message && <div className="message-box">{message}</div>}

      <section>
        <h3>Employés Encadrants</h3>
        <ul>
          {employes.length === 0 ? (
            <p>Aucun encadrant professionnel.</p>
          ) : (
            employes.map(emp => (
              <li key={emp.id}>{emp.prenom} {emp.nom} – {emp.email}</li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h3>Stagiaires de l’Entreprise</h3>
        <ul>
          {stagiaires.length === 0 ? (
            <p>Aucun stagiaire actuellement.</p>
          ) : (
            stagiaires.map(stag => (
              <li key={stag.id}>{stag.prenom} {stag.nom} – {stag.email}</li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h3>Notifications</h3>
        <ul>
          {notifications.length === 0 ? (
            <p>Aucune notification.</p>
          ) : (
            notifications.map(notif => (
              <li key={notif.id}>
                {notif.message} <span className="date">{new Date(notif.date_envoi).toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

export default DashboardRespEntreprise;
