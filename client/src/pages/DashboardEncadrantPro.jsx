import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "./DashboardEncadrantAca.css";

function DashboardEncadrantPro() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const [propositions, setPropositions] = useState([]);
  const [encadrements, setEncadrements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [commentaire, setCommentaire] = useState("");
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
    fetchRapports();
  }, []);

  const fetchPropositions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/propositionsPro", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPropositions(res.data);
    } catch {
      setMessage("Erreur lors du chargement des propositions.");
    }
  };

  const fetchEncadrements = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/encadrementsPro", {
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

  const fetchRapports = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/rapports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRapports(res.data);
    } catch {
      setMessage("Erreur lors du chargement des rapports.");
    }
  };

  const commenterRapport = async (rapportId) => {
    try {
      if (!commentaire.trim()) return alert("Commentaire vide");
      await axios.post("http://localhost:3000/api/stage/commenter-rapport", { rapportId, commentaire }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Commentaire envoyé à l'étudiant.");
      setCommentaire("");
    } catch {
      setMessage("Erreur lors de l'envoi du commentaire.");
    }
  };

  const validerRapport = async (rapportId) => {
    try {
      await axios.post("http://localhost:3000/api/stage/validateReport", { rapportId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Rapport validé.");
      fetchRapports();
    } catch {
      setMessage("Erreur validation rapport.");
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

  return (
    <div className="dashboard-aca">
      <h2>Encadrant Professionnel</h2>
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
        <h3>Rapports à Examiner</h3>
        {rapports.map(r => (
          <div key={r.id} className="rapport-item">
            <p><strong>{r.prenomEtudiant} {r.nomEtudiant}</strong> – <a href={`http://localhost:3000${r.fichier}`} target="_blank" rel="noreferrer">Voir le rapport</a></p>
            <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Ajouter un commentaire..." />
            <div className="btn-group">
              <button className="btn-comment" onClick={() => commenterRapport(r.id)}>Commenter</button>
              <button className="btn-validate" onClick={() => validerRapport(r.id)}>Valider</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default DashboardEncadrantPro;
