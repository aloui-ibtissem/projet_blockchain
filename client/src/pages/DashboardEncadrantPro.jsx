import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./DashboardEncadrantPro.css";

function DashboardEncadrantPro() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const [propositions, setPropositions] = useState([]);
  const [encadrements, setEncadrements] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      if (!token || role !== "EncadrantProfessionnel") {
        navigate("/login");
        return;
      }
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        localStorage.clear();
        navigate("/login");
      }

      fetchPropositions();
      fetchEncadrements();
    } catch {
      localStorage.clear();
      navigate("/login");
    }
  }, []);

  const fetchPropositions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/propositions", {
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

  const acceptStage = async (id) => {
    try {
      await axios.post("http://localhost:3000/api/stage/validate-sujet", { id }, {
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
      <h2>Espace Encadrant Professionnel</h2>
      {message && <div className="message-box">{message}</div>}

      <section>
        <h3>Propositions de Stage</h3>
        {propositions.length === 0 ? (
          <p>Aucune proposition en attente.</p>
        ) : (
          <ul className="list">
            {propositions.map((p) => (
              <li key={p.id}>
                <strong>{p.titre}</strong> - Étudiant : {p.etudiant}
                <button onClick={() => acceptStage(p.id)}>Accepter</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Encadrements en cours</h3>
        {encadrements.length === 0 ? (
          <p>Vous n'encadrez aucun stage.</p>
        ) : (
          <ul className="list">
            {encadrements.map((s) => (
              <li key={s.id}>
                Stage : <strong>{s.titre}</strong> - Étudiant : {s.etudiant}
                <span>Status : {s.status}</span>
                {s.status === "rapport_soumis" && (
                  <button onClick={() => validerRapport(s.id)}>Valider le rapport</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default DashboardEncadrantPro;
