import React, { useEffect, useState } from "react";
import axios from "axios";
import "./DashboardEncadrant.css";

function DashboardEncadrantAca({ token }) {
  const [propositions, setPropositions] = useState([]);
  const [stages, setStages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPropositions();
    fetchEncadrementList();
  }, []);

  const fetchPropositions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/propositions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPropositions(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors du chargement des propositions");
    }
  };

  const fetchEncadrementList = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/stage/encadrements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStages(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors du chargement des stages encadrés");
    }
  };

  const acceptStage = async (stageId) => {
    try {
      await axios.post(
        "http://localhost:3001/api/stage/accept",
        { stageIdOnChain: stageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Stage accepté !");
      fetchPropositions();
    } catch (err) {
      setMessage("❌ " + err.response?.data?.error || err.message);
    }
  };

  const validateReport = async (stageId) => {
    try {
      await axios.post(
        "http://localhost:3001/api/stage/validateReport",
        { stageIdOnChain: stageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Rapport validé !");
      fetchEncadrementList();
    } catch (err) {
      setMessage("❌ " + err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="encadrant-dashboard">
      <h2>👨‍🏫 Espace Encadrant Académique</h2>

      {message && <div className="alert-box">{message}</div>}

      <div className="dashboard-section">
        <h3>📬 Propositions de Stage à valider</h3>
        {propositions.length === 0 ? (
          <p>Aucune proposition à examiner</p>
        ) : (
          <ul>
            {propositions.map((p) => (
              <li key={p.stageId}>
                <strong>{p.sujet}</strong> par {p.etudiant}
                <button onClick={() => acceptStage(p.stageId)}>✅ Accepter</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dashboard-section">
        <h3>🎓 Stages que j'encadre</h3>
        {stages.length === 0 ? (
          <p>Vous n'encadrez aucun stage actuellement.</p>
        ) : (
          <ul>
            {stages.map((s) => (
              <li key={s.stageId}>
                Stage #{s.stageId} - Étudiant : {s.etudiant}
                <span>Status : {s.status}</span>
                {s.status === "ReportSubmitted" && (
                  <button onClick={() => validateReport(s.stageId)}>📝 Valider Rapport</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DashboardEncadrantAca;
