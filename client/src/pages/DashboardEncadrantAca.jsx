import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "./DashboardEncadrantAca.css";

function DashboardEncadrantAca() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const [propositions, setPropositions] = useState([]);
  const [encadrements, setEncadrements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || role !== "EncadrantAcademique") return navigate("/login");

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
      const res = await axios.get("http://localhost:3000/api/stage/propositions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPropositions(res.data);
    } catch {
      setMessage("Erreur lors du chargement des propositions.");
    }
  };

  const fetchEncadrements = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/encadrements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEncadrements(res.data);
    } catch {
      setMessage("Erreur lors du chargement des encadrements.");
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

  const handleDecision = async (id, action) => {
    try {
      let commentaire = "";
      if (action === "rejeter") {
        commentaire = prompt("Motif du refus (facultatif) :") || "";
      }
      await axios.post("http://localhost:3000/api/stage/validate-sujet", {
        sujetId: id,
        action,
        commentaire,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(`Sujet ${action === "accepter" ? "accepté" : "refusé"}.`);
      fetchPropositions();
    } catch {
      setMessage("Erreur lors de l'action.");
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
    <div className="dashboard-aca">
      <h2>Encadrant Académique</h2>
      {message && <div className="alert">{message}</div>}

      <section>
        <h3>Notifications</h3>
        <ul>
          {notifications.map(n => (
            <li key={n.id}>{n.message} - <small>{new Date(n.date_envoi).toLocaleDateString()}</small></li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Propositions de Stage</h3>
        {propositions.length === 0 ? (
          <p>Aucune proposition en attente.</p>
        ) : (
          <ul className="proposition-list">
            {propositions.map(p => (
              <li key={p.id}>
                <strong>{p.titre}</strong><br />
                <span><strong>Objectifs :</strong> {p.description}</span><br />
                <span><strong>Étudiant :</strong> {p.etudiantNomComplet}</span>
                <div className="btn-group">
                  <button className="btn-accept" onClick={() => handleDecision(p.id, "accepter")}> Accepter</button>
                  <button className="btn-reject" onClick={() => handleDecision(p.id, "rejeter")}> Rejeter</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3> Stages Encadrés</h3>
        <ul>
          {encadrements.map(e => (
            <li key={e.id}>
              <strong>{e.titre}</strong> – Étudiant : {e.etudiant}
              
              {e.status === "rapport_soumis" && (
                <button onClick={() => validerRapport(e.id)}>Valider le Rapport</button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default DashboardEncadrantAca;
