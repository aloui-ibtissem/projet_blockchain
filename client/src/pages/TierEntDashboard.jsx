import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import {
  Container, Row, Col, Card, Button, Alert, Table, Spinner
} from "react-bootstrap";
import "./DashboardTierEnt.css";

function TierEntDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [rapports, setRapports] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== "TierDebloqueur") return navigate("/login");

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.clear();
        return navigate("/login");
      }
      fetchRapports();
    } catch {
      localStorage.clear();
      return navigate("/login");
    }
  }, []);

  const fetchRapports = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:3000/api/rapport/tiers-entreprise", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRapports(Array.isArray(data) ? data : []);
      setMessage("");
    }  catch (err) {
      console.warn("Erreur de récupération des rapports :", err.message);
      setRapports([]); // pour éviter affichage résiduels
      setMessage("");  // pas de message utilisateur
    } finally {
      setLoading(false);
    }
  };

  const validerRapport = async (rapportId) => {
    try {
      await axios.post("http://localhost:3000/api/rapport/valider-par-tier", {
        rapportId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(" Rapport validé.");
      fetchRapports();
    } catch {
      setMessage(" Erreur lors de la validation.");
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={11} lg={10}>
          <Card className="shadow border-0 dashboard-card">
            <Card.Header className="dashboard-header bg-dark text-white">
              <h5 className="mb-0 fw-bold">Espace  Entreprise</h5>
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="secondary">{message}</Alert>}

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="dark" />
                </div>
              ) : rapports.length > 0 ? (
                <Table striped bordered hover responsive className="align-middle text-center">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>ID Étudiant</th>
                      <th>Période</th>
                      <th>Soumis le</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapports.map((r, i) => (
                      <tr key={r.rapportId}>
                        <td>{i + 1}</td>
                        <td>{`ETU-${r.rapportId.toString().padStart(4, "0")}`}</td>
                        <td>{new Date(r.dateDebut).toLocaleDateString()} → {new Date(r.dateFin).toLocaleDateString()}</td>
                        <td>{new Date(r.dateSoumission).toLocaleDateString()}</td>
                        <td>
                          <Button variant="outline-success" size="sm" onClick={() => validerRapport(r.rapportId)}>
                            Valider
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-muted text-center pt-3">Aucun rapport à traiter.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TierEntDashboard;
