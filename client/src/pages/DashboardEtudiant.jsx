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
  const [form, setForm] = useState({ sujet: "", objectifs: "", dateDebut: "", dateFin: "", encadrantAcademique: "", encadrantProfessionnel: "", entrepriseId: "" });
  const [rapport, setRapport] = useState(null);
  const [attestationUrl, setAttestationUrl] = useState("");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token || role !== "Etudiant") return navigate("/login");
    const decoded = jwtDecode(token);
    setUserEmail(decoded.email);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      return navigate("/login");
    }
    fetchNotifications();
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const proposeStage = async () => {
    try {
      setMessage("Envoi de la proposition...");
      await axios.post("http://localhost:3000/api/stage/propose", form, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Proposition envoyée avec succès !");
    } catch (err) {
      setMessage("Erreur : " + (err.response?.data?.error || err.message));
    }
  };

  const submitRapport = async () => {
    if (!rapport) return setMessage("Veuillez sélectionner un fichier PDF.");
    const formData = new FormData();
    formData.append("rapport", rapport);
    try {
      await axios.post("http://localhost:3000/api/stage/submitReport", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setMessage("Rapport soumis avec succès !");
    } catch (err) {
      setMessage("Erreur : " + (err.response?.data?.error || err.message));
    }
  };

  const fetchAttestation = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/attestation", { headers: { Authorization: `Bearer ${token}` } });
      setAttestationUrl(res.data.attestationUrl);
    } catch {
      setMessage("Aucune attestation trouvée.");
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data);
    } catch (err) {
      console.error("Erreur notifications", err);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center">Dashboard Étudiant</h2>
      {message && <Alert variant="info">{message}</Alert>}

      <Card className="mb-4">
        <Card.Header>Informations personnelles</Card.Header>
        <Card.Body><strong>Email :</strong> {userEmail}</Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Notifications</Card.Header>
        <Card.Body>
          <ul>
            {notifications.map(n => (
              <li key={n.id}>{n.message} - <small>{new Date(n.date_envoi).toLocaleDateString()}</small></li>
            ))}
          </ul>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Proposer un Sujet de Stage</Card.Header>
        <Card.Body>
          <Form>
            <Row>
              <Col md={6}><Form.Group><Form.Label>Sujet</Form.Label><Form.Control name="sujet" value={form.sujet} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Objectifs</Form.Label><Form.Control name="objectifs" value={form.objectifs} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}><Form.Group><Form.Label>Date de Début</Form.Label><Form.Control type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Date de Fin</Form.Label><Form.Control type="date" name="dateFin" value={form.dateFin} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <Row className="mt-3">
              <Col md={6}><Form.Group><Form.Label>Adresse Encadrant Académique</Form.Label><Form.Control name="encadrantAcademique" value={form.encadrantAcademique} onChange={handleChange} /></Form.Group></Col>
              <Col md={6}><Form.Group><Form.Label>Adresse Encadrant Professionnel</Form.Label><Form.Control name="encadrantProfessionnel" value={form.encadrantProfessionnel} onChange={handleChange} /></Form.Group></Col>
            </Row>
            <Form.Group className="mt-3">
              <Form.Label>ID Entreprise</Form.Label>
              <Form.Control name="entrepriseId" value={form.entrepriseId} onChange={handleChange} />
            </Form.Group>
            <Button className="mt-3" onClick={proposeStage} variant="primary">Soumettre</Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Soumission du Rapport</Card.Header>
        <Card.Body>
          <Form.Group><Form.Label>Fichier PDF</Form.Label><Form.Control type="file" accept="application/pdf" onChange={e => setRapport(e.target.files[0])} /></Form.Group>
          <Button className="mt-2" onClick={submitRapport} variant="success">Envoyer le Rapport</Button>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Attestation</Card.Header>
        <Card.Body>
          <Button variant="info" onClick={fetchAttestation}>Vérifier l'attestation</Button>
          {attestationUrl && <p className="mt-2"><a href={attestationUrl} target="_blank" rel="noreferrer">Voir l’attestation</a></p>}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default DashboardEtudiant;
