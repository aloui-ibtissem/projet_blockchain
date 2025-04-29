import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Table,
  Spinner,
} from "react-bootstrap";
import "./DashboardTierEnt.css";

function DashboardTierEnt() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [userEmail, setUserEmail] = useState("");
  const [rapports, setRapports] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== "TierDebloqueur") return navigate("/login");

    const decoded = jwtDecode(token);
    setUserEmail(decoded.email);

    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      return navigate("/login");
    }

    fetchRapports();
  }, []);

  const fetchRapports = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:3000/api/rapport/tiers-entreprise", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRapports(res.data || []);
    } catch (err) {
      console.error("Erreur récupération rapports:", err);
      setMessage("Erreur lors de la récupération des rapports.");
    } finally {
      setLoading(false);
    }
  };

  const validerRapport = async (id) => {
    try {
      await axios.post(
        "http://localhost:3000/api/rapport/valider-par-tier",
        { rapportId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Rapport validé avec succès.");
      fetchRapports();
    } catch (err) {
      setMessage("❌ Erreur lors de la validation.");
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white">
              <h4 className="mb-0">Tier Débloqueur – Entreprise</h4>
              <small>{userEmail}</small>
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="info">{message}</Alert>}

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <>
                  {rapports.length > 0 ? (
                    <Table striped bordered hover responsive className="mt-3">
                      <thead className="table-dark">
                        <tr>
                          <th>Étudiant</th>
                          <th>Date Début</th>
                          <th>Date Fin</th>
                          <th>Date Soumission</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rapports.map((r) => (
                          <tr key={r.rapportId}>
                            <td>{r.etudiantPrenom} {r.etudiantNom}</td>
                            <td>{new Date(r.dateDebut).toLocaleDateString()}</td>
                            <td>{new Date(r.dateFin).toLocaleDateString()}</td>
                            <td>{new Date(r.dateSoumission).toLocaleDateString()}</td>
                            <td>
                              <Button
                                variant="success"
                                size="sm"
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
                    <p className="text-muted text-center">Aucun rapport en attente de validation.</p>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DashboardTierEnt;
