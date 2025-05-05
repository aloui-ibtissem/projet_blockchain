// DashboardEncadrantAca.jsx
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
  const [rapports, setRapports] = useState([]);
  const [commentaire, setCommentaire] = useState("");
  const [selectedRapport, setSelectedRapport] = useState(null);
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
    fetchRapports();
  }, []);

  const fetchPropositions = async () => {
    const res = await axios.get("http://localhost:3000/api/stage/propositions/academique", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPropositions(res.data);
  };

  const fetchEncadrements = async () => {
    const res = await axios.get("http://localhost:3000/api/stage/encadrements/academique", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEncadrements(res.data);
  };

  const fetchNotifications = async () => {
    const res = await axios.get("http://localhost:3000/api/stage/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications(res.data);
  };

  const fetchRapports = async () => {
    const res = await axios.get("http://localhost:3000/api/rapport/mes-rapports", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRapports(res.data);
  };

  const commenterRapport = async () => {
    if (!commentaire || !selectedRapport) return;
    await axios.post("http://localhost:3000/api/rapport/commenter", {
      rapportId: selectedRapport,
      commentaire,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessage("Commentaire envoyé.");
    setCommentaire("");
  };

  const validerRapport = async (rapportId) => {
    await axios.post("http://localhost:3000/api/rapport/validate", {
      rapportId
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessage("Rapport validé.");
    fetchRapports();
  };

  const handleDecision = async (id, action) => {
    let commentaire = "";
    if (action === "rejeter") commentaire = prompt("Motif du refus :") || "";

    await axios.post("http://localhost:3000/api/stage/validate-sujet", {
      sujetId: id,
      action,
      commentaire,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessage("Sujet traité.");
    fetchPropositions();
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
        {propositions.length === 0 ? <p>Aucune proposition.</p> : (
          <ul className="proposition-list">
            {propositions.map(p => (
              <li key={p.id}>
                <strong>{p.titre}</strong><br />
                <em>{p.description}</em><br />
                <span>{p.etudiantNomComplet}</span>
                <div className="btn-group">
                  <button onClick={() => handleDecision(p.id, "accepter")}>Accepter</button>
                  <button onClick={() => handleDecision(p.id, "rejeter")}>Rejeter</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Rapports à Examiner</h3>
        {rapports.length === 0 ? <p>Aucun rapport.</p> : (
          <ul>
            {rapports.map(r => (
              <li key={r.id}>
                <strong>{r.prenomEtudiant} {r.nomEtudiant}</strong> - {new Date(r.dateSoumission).toLocaleDateString()}
                <a href={`http://localhost:3000${r.fichier}`} target="_blank" rel="noreferrer">Voir fichier</a>
                <br />
                <textarea placeholder="Commentaire" onChange={(e) => setCommentaire(e.target.value)} />
                <button onClick={() => { setSelectedRapport(r.id); commenterRapport(); }}>Envoyer Commentaire</button>
                <button onClick={() => validerRapport(r.id)}>Valider</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default DashboardEncadrantAca;
