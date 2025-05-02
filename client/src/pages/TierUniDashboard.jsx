import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Row, Col, Card, Button, Alert, Table, Spinner
} from "react-bootstrap";
import "./DashboardTierUni.css";

function TierUniDashboard() {
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
      const { data } = await axios.get("http://localhost:3000/api/rapport/tiers-universite", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRapports(Array.isArray(data) ? data : []);
      setMessage("");
    }  catch (err) {
      console.warn("Erreur de récupération des rapports :", err.message);
      setRapports([]); // pour éviter affichage résiduels
      setMessage("");  // pas de message utilisateur
    }finally {
      setLoading(false);
    }
  };

  const validerRapport = async (id) => {
    try {
      await axios.post("http://localhost:3000/api/rapport/valider-par-tier", {
        rapportId: id
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Rapport validé avec succès.");
      fetchRapports();
    } catch {
      setMessage(" Échec de validation.");
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={11} lg={10}>
          <Card className="border-0 shadow dashboard-card">
            <Card.Header className="dashboard-header bg-primary text-white">
              <h5 className="mb-0 fw-bold">Espace  Universitaire</h5>
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="secondary">{message}</Alert>}

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : rapports.length > 0 ? (
                <Table responsive bordered className="align-middle text-center">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>ID Étudiant</th>
                      <th>Période de Stage</th>
                      <th>Date Soumission</th>
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
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => validerRapport(r.rapportId)}
                          >
                            Valider
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-muted text-center pt-3">Aucun rapport à valider actuellement.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TierUniDashboard;
