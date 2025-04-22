import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "./DashboardEncadrantPro.css";

function DashboardEncadrantPro() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const [propositions, setPropositions] = useState([]);
  const [encadrements, setEncadrements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || role !== "EncadrantProfessionnel") return navigate("/login");

    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      return navigate("/login");
    }

    fetchPropositions();
    fetchEncadrements();
    fetchNotifications();
  }, []);

  const fetchPropositions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/propositionsPro", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPropositions(res.data);
    } catch {
      setMessage("Erreur chargement des propositions.");
    }
  };

  const fetchEncadrements = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/encadrementsPro", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEncadrements(res.data);
    } catch {
      setMessage("Erreur chargement des stages.");
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Erreur notifications", err);
    }
  };

  const acceptStage = async (id) => {
    try {
      await axios.post("http://localhost:3000/api/stage/validate-sujet", { sujetId: id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Stage accepté.");
      fetchPropositions();
    } catch {
      setMessage("Erreur lors de l'acceptation.");
    }
  };

  const validerRapport = async (stageId) => {
    try {
      await axios.post("http://localhost:3000/api/stage/validateReport", { stageId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Rapport validé.");
      fetchEncadrements();
    } catch {
      setMessage("Erreur validation rapport.");
    }
  };

  return (
    <div className="dashboard-pro">
      <h2>Encadrant Professionnel</h2>
      {message && <div className="alert">{message}</div>}

      <section>
        <h3> Notifications</h3>
        <ul>
          {notifications.map(n => (
            <li key={n.id}>{n.message} - <small>{new Date(n.date_envoi).toLocaleDateString()}</small></li>
          ))}
        </ul>
      </section>

      <section>
        <h3> Propositions à valider</h3>
        <ul>
          {propositions.map(p => (
            <li key={p.id}>
              <strong>{p.titre}</strong> – Étudiant : {p.etudiantEmail}
              <button onClick={() => acceptStage(p.id)}> Accepter</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3> Stages suivis</h3>
        <ul>
          {encadrements.map(e => (
            <li key={e.id}>
              <strong>{e.titre}</strong> – Étudiant : {e.etudiant}
              <span>Status : {e.status}</span>
              {e.status === "rapport_soumis" && (
                <button onClick={() => validerRapport(e.id)}> Valider le Rapport</button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default DashboardEncadrantPro;
