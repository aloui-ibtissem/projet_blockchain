// src/pages/DashboardRespUniversite.js
import React, { useState } from "react";
import "./DashboardRespUniversite.css";

function DashboardRespUniversite() {
  const [attestations, setAttestations] = useState([
    {
      id: 1,
      etudiant: "Yasmine Mansour",
      stageId: "42",
      uri: "ipfs://Qm123...abc",
      validée: false
    },
    {
      id: 2,
      etudiant: "Omar Hamdi",
      stageId: "43",
      uri: "ipfs://Qm456...def",
      validée: false
    }
  ]);

  const validerAttestation = (id) => {
    setAttestations(prev =>
      prev.map(a => (a.id === id ? { ...a, validée: true } : a))
    );
    alert("✅ Attestation validée (simulation)");
  };

  const encadrants = [
    { id: 1, prenom: "Ali", nom: "Ben Ali", email: "ali@univ.tn" },
    { id: 2, prenom: "Sara", nom: "Trabelsi", email: "sara@univ.tn" },
  ];

  const etudiants = [
    { id: 1, prenom: "Yasmine", nom: "Mansour", email: "yasmine@etudiant.tn" },
    { id: 2, prenom: "Omar", nom: "Hamdi", email: "omar@etudiant.tn" },
  ];

  const notifications = [
    { id: 1, message: "📌 Rapport validé pour Yasmine", date_envoi: "2025-04-10" },
    { id: 2, message: "📩 Proposition de stage reçue", date_envoi: "2025-04-09" },
  ];

  return (
    <div className="dashboard-univ">
      <h2>🎓 Dashboard Responsable Universitaire</h2>

      <div className="section">
        <h3>📋 Encadrants Académiques</h3>
        <ul>
          {encadrants.map((e) => (
            <li key={e.id}>{e.prenom} {e.nom} – {e.email}</li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3>🧑‍🎓 Étudiants</h3>
        <ul>
          {etudiants.map((e) => (
            <li key={e.id}>{e.prenom} {e.nom} – {e.email}</li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3>🔔 Notifications</h3>
        <ul>
          {notifications.map((n) => (
            <li key={n.id}>{n.message} – <small>{n.date_envoi}</small></li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3>📩 Attestations Reçues</h3>
        <ul>
          {attestations.map((a) => (
            <li key={a.id}>
              🎓 {a.etudiant} — Stage #{a.stageId} <br />
              🔗 <a href={a.uri} target="_blank" rel="noreferrer">{a.uri}</a> <br />
              {a.validée ? (
                <span className="validé">✅ Validée</span>
              ) : (
                <button onClick={() => validerAttestation(a.id)}>Valider</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default DashboardRespUniversite;
