import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Alert } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";

const BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";
const API_URL = BASE.includes("/api") ? BASE : `${BASE}/api`;

function TierEntDashboard() {
  const token = localStorage.getItem("token");
  const [rapportsAca, setRapportsAca] = useState([]);
  const [rapportsPro, setRapportsPro] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(false);

  const decoded = token ? jwtDecode(token) : null;
  const role = decoded?.role;

  const fetchRapports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/rapport/tier/rapports-assignes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRapportsAca(res.data.enAttenteAcademique || []);
      setRapportsPro(res.data.enAttenteProfessionnel || []);
    } catch (err) {
      setErrorMsg("Erreur de chargement des rapports.");
    }
    setLoading(false);
  };

  const validerRapport = async (rapportId) => {
    try {
      await axios.post(
        `${API_URL}/api/rapport/tier/valider`,
        { rapportId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMsg("Rapport validé avec succès.");
      setRefreshFlag(!refreshFlag);
    } catch (err) {
      setErrorMsg("Erreur lors de la validation.");
    }
  };

  useEffect(() => {
    fetchRapports();
  }, [refreshFlag]);

  const renderRapportCard = (r, type) => (
    <div key={r.id} className="dashboard-card p-3 mb-3 shadow-sm border rounded">
      <h6>
        <strong>{r.identifiantRapport}</strong> — {r.titre}
      </h6>
      <p className="mb-1">Étudiant : {r.prenomEtudiant} {r.nomEtudiant}</p>
      <p className="mb-1">Date fin de stage : {new Date(r.dateFin).toLocaleDateString()}</p>
      <p className="mb-1">Soumis le : {new Date(r.dateSoumission).toLocaleDateString()}</p>
      <p className="mb-1"><strong>Type de validation attendue : </strong>{type}</p>
      <a href={`${API_URL}/uploads/${r.fichier}`} target="_blank" rel="noreferrer">
        Voir le rapport PDF
      </a>
      <div className="mt-2">
        <Button variant="success" size="sm" onClick={() => validerRapport(r.id)}>
          Valider ce rapport
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mt-4">
      <h4 className="mb-4 text-center">Tableau de bord – Tier Validateur</h4>

      {successMsg && <Alert variant="success" onClose={() => setSuccessMsg("")} dismissible>{successMsg}</Alert>}
      {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg("")} dismissible>{errorMsg}</Alert>}
      {loading ? <Spinner animation="border" /> : (
        <>
          <h5 className="text-primary mb-2">📘 Rapports à valider – Université</h5>
          {rapportsAca.length === 0 ? <p>Aucun rapport académique à valider.</p> :
            rapportsAca.map(r => renderRapportCard(r, "Académique"))}

          <h5 className="text-success mt-4 mb-2">🏢 Rapports à valider – Entreprise</h5>
          {rapportsPro.length === 0 ? <p>Aucun rapport professionnel à valider.</p> :
            rapportsPro.map(r => renderRapportCard(r, "Professionnel"))}
        </>
      )}
    </div>
  );
}

export default TierEntDashboard;
