// src/pages/DashboardEtudiant.jsx
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Button, Form, Alert } from "react-bootstrap";
import "./DashboardEtudiant.css"; 

function DashboardEtudiant() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    sujet: "",
    objectifs: "",
    dateDebut: "",
    dateFin: "",
    encadrantAcademique: "",
    encadrantProfessionnel: "",
    entrepriseId: "",
  });

  const [rapport, setRapport] = useState(null);
  const [attestationUrl, setAttestationUrl] = useState("");

  // Vérification Token + Rôle
  useEffect(() => {
    try {
      if (!token || role !== "Etudiant") {
        navigate("/login");
        return;
      }

      const decoded = jwtDecode(token);
      setUserEmail(decoded.email);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        localStorage.clear();
        navigate("/login");
      }

      //  Blocage retour
      window.onpopstate = () => {
        if (!localStorage.getItem("token")) {
          navigate("/login");
        }
      };
    } catch (err) {
      localStorage.clear();
      navigate("/login");
    }
  }, [navigate, token, role]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const proposeStage = async () => {
    try {
      setMessage(" Envoi de la proposition...");
      await axios.post("http://localhost:3000/api/stage/propose", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(" Proposition envoyée avec succès !");
    } catch (err) {
      setMessage(" Erreur : " + (err.response?.data?.error || err.message));
    }
  };

  const submitRapport = async () => {
    if (!rapport) {
      setMessage(" Veuillez sélectionner un fichier PDF.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("rapport", rapport);

      await axios.post("http://localhost:3000/api/stage/submitReport", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(" Rapport soumis avec succès !");
    } catch (err) {
      setMessage(" Erreur : " + (err.response?.data?.error || err.message));
    }
  };

  const fetchAttestation = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/attestation", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttestationUrl(res.data.attestationUrl);
    } catch (err) {
      setMessage(" Aucune attestation trouvée.");
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center">Dashboard Étudiant</h2>
      {message && <Alert variant="info">{message}</Alert>}

      {/* Informations de l'étudiant */}
      <Card className="mb-4">
        <Card.Header> Informations personnelles</Card.Header>
        <Card.Body>
          <p><strong>Email :</strong> {userEmail}</p>
        </Card.Body>
      </Card>

      {/* Proposition de stage */}
      <Card className="mb-4">
        <Card.Header> Proposer un Sujet de Stage</Card.Header>
        <Card.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Sujet</Form.Label>
                  <Form.Control name="sujet" value={form.sujet} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Objectifs</Form.Label>
                  <Form.Control name="objectifs" value={form.objectifs} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date de Début</Form.Label>
                  <Form.Control type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date de Fin</Form.Label>
                  <Form.Control type="date" name="dateFin" value={form.dateFin} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Adresse Encadrant Académique</Form.Label>
                  <Form.Control name="encadrantAcademique" value={form.encadrantAcademique} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Adresse Encadrant Professionnel</Form.Label>
                  <Form.Control name="encadrantProfessionnel" value={form.encadrantProfessionnel} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mt-3">
              <Form.Label>ID Entreprise</Form.Label>
              <Form.Control name="entrepriseId" value={form.entrepriseId} onChange={handleChange} />
            </Form.Group>
            <Button className="mt-3" onClick={proposeStage} variant="primary"> Soumettre</Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Soumission du rapport */}
      <Card className="mb-4">
        <Card.Header> Soumission du Rapport de Stage</Card.Header>
        <Card.Body>
          <Form.Group>
            <Form.Label>Fichier PDF</Form.Label>
            <Form.Control type="file" accept="application/pdf" onChange={(e) => setRapport(e.target.files[0])} />
          </Form.Group>
          <Button className="mt-2" onClick={submitRapport} variant="success"> Envoyer le Rapport</Button>
        </Card.Body>
      </Card>

      {/* Attestation de stage */}
      <Card className="mb-4">
        <Card.Header> Attestation de Stage</Card.Header>
        <Card.Body>
          <Button variant="info" onClick={fetchAttestation}> Vérifier l'attestation</Button>
          {attestationUrl && (
            <p className="mt-2">
               <a href={attestationUrl} target="_blank" rel="noreferrer">Voir l’attestation</a>
            </p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default DashboardEtudiant;
