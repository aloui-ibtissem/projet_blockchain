// src/pages/DashboardRespEntreprise.js
import React, { useState } from "react";
import "./DashboardRespEntreprise.css";

function DashboardRespEntreprise({ token }) {
  const [stageIdOnChain, setStageIdOnChain] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Données statiques
  const stagiaires = [
    { id: 1, prenom: "Aya", nom: "Ben Salem", email: "aya@etudiant.tn" },
    { id: 2, prenom: "Nizar", nom: "Kefi", email: "nizar@etudiant.tn" },
  ];

  const employes = [
    { id: 1, prenom: "Rami", nom: "Triki", email: "rami@entreprise.tn" },
    { id: 2, prenom: "Maha", nom: "Farhat", email: "maha@entreprise.tn" },
  ];

  const notifications = [
    { id: 1, message: "📝 Rapport à valider pour Nizar Kefi", date_envoi: "2025-04-10" },
    { id: 2, message: "📨 Demande de backup validée", date_envoi: "2025-04-08" },
  ];

  const sendAttestation = async () => {
    setStatusMessage("✅ Attestation envoyée (simulation)");
  };

  return (
    <div className="dashboard-entreprise">
      <h2>🏢 Dashboard Responsable Entreprise</h2>

      <div className="section">
        <h3>👔 Employés de l’entreprise</h3>
        <ul>
          {employes.map((emp) => (
            <li key={emp.id}>{emp.prenom} {emp.nom} – {emp.email}</li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3>🎓 Stagiaires de l’entreprise</h3>
        <ul>
          {stagiaires.map((stagiaire) => (
            <li key={stagiaire.id}>{stagiaire.prenom} {stagiaire.nom} – {stagiaire.email}</li>
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
        <h3>📨 Générer et Envoyer une Attestation</h3>
        <input placeholder="ID du Stage" value={stageIdOnChain} onChange={(e) => setStageIdOnChain(e.target.value)} />
        <input placeholder="URI Métadonnées" value={metadataURI} onChange={(e) => setMetadataURI(e.target.value)} />
        <button onClick={sendAttestation}>📤 Envoyer à l’étudiant + université</button>
        {statusMessage && <p className="message">{statusMessage}</p>}
      </div>
    </div>
  );
}

export default DashboardRespEntreprise;
