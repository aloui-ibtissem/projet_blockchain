import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { Container, Card, Button, Alert } from "react-bootstrap";
import "./DashboardEncadrant.css";

function DashboardEncadrantAca() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [propositions, setPropositions] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || role !== "EncadrantAcademique") {
      navigate("/login");
      return;
    }

    const decoded = jwtDecode(token);
    if (Date.now() / 1000 > decoded.exp) {
      localStorage.clear();
      navigate("/login");
    }

    fetchPropositions();
    window.onpopstate = () => localStorage.getItem("token") || navigate("/login");
  }, []);

  const fetchPropositions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/propositions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPropositions(res.data);
    } catch (err) {
      setMessage("Erreur de chargement des propositions.");
    }
  };

  const handleAccept = async (id) => {
    try {
      await axios.post("http://localhost:3000/api/stage/accept", { id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Proposition acceptée.");
      fetchPropositions();
    } catch (err) {
      setMessage("Erreur lors de l'acceptation.");
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center">Espace Encadrant Académique</h2>
      {message && <Alert variant="info">{message}</Alert>}

      <Card className="mb-3">
        <Card.Header>Propositions reçues</Card.Header>
        <Card.Body>
          {propositions.length === 0 ? (
            <p>Aucune proposition disponible.</p>
          ) : (
            <ul className="list-group">
              {propositions.map((p) => (
                <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {p.titre} – {p.etudiantEmail}
                  <Button size="sm" onClick={() => handleAccept(p.id)}>Accepter</Button>
                </li>
              ))}
            </ul>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default DashboardEncadrantAca;
