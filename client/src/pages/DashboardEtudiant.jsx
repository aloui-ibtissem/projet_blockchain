// DashboardEtudiant.jsx
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Button, Form, Alert, Collapse } from "react-bootstrap";
import "./DashboardEtudiant.css";

function DashboardEtudiant() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    sujet: "", objectifs: "", dateDebut: "", dateFin: "", encadrantAcademique: "", encadrantProfessionnel: ""
  });
  const [rapport, setRapport] = useState(null);
  const [attestationUrl, setAttestationUrl] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [currentStage, setCurrentStage] = useState(null);
  const [commentaires, setCommentaires] = useState([]);

  useEffect(() => {
    if (!token || role !== "Etudiant") return navigate("/login");
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      return navigate("/login");
    }
    setUserEmail(decoded.email);
    fetchNotifications();
    fetchStage();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const proposeStage = async () => {
    try {
      setMessage("Envoi de la proposition...");
      await axios.post("http://localhost:3000/api/stage/propose", form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Proposition envoyée avec succès !");
    } catch (err) {
      setMessage("Erreur : " + (err.response?.data?.error || err.message));
    }
  };

  const submitRapport = async () => {
    if (!rapport) return setMessage("Veuillez sélectionner un fichier PDF ou DOCX.");
    const formData = new FormData();
    formData.append("rapport", rapport);
    try {
      await axios.post("http://localhost:3000/api/rapport/submit", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setMessage("Rapport soumis avec succès !");
      fetchCommentaires(); // Charger les commentaires si déjà disponibles
    } catch (err) {
      setMessage("Erreur : " + (err.response?.data?.error || err.message));
    }
  };

  const fetchAttestation = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/attestation", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttestationUrl(res.data.attestationUrl);
    } catch {
      setMessage("Aucune attestation trouvée.");
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Erreur notifications", err);
    }
  };

  const fetchStage = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/stage/current", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentStage(res.data);
      if (res.data?.rapportId) fetchCommentaires(res.data.rapportId);
    } catch (err) {
      console.warn("Aucun stage trouvé pour l'étudiant.");
    }
  };

  const fetchCommentaires = async (rapportId) => {
    try {
      const res = await axios.get(`http://localhost:3000/api/rapport/commentaires/${rapportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommentaires(res.data);
    } catch (err) {
      console.warn("Aucun commentaire disponible.");
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center">Dashboard Étudiant</h2>
      {message && <Alert variant="info">{message}</Alert>}

      <Card className="mb-4">
        <Card.Header>
          Notifications
          <Button variant="link" onClick={() => setNotificationsVisible(!notificationsVisible)}>Afficher/Masquer</Button>
        </Card.Header>
        <Collapse in={notificationsVisible}>
          <Card.Body>
            {notifications.length > 0 ? (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    {n.message} <small>({new Date(n.date_envoi).toLocaleDateString()})</small>
                  </li>
                ))}
              </ul>
            ) : <p>Aucune notification pour l'instant.</p>}
          </Card.Body>
        </Collapse>
      </Card>

      {currentStage && (
        <Card className="mb-4">
          <Card.Header>Stage en cours</Card.Header>
          <Card.Body>
            <p><strong>Entreprise :</strong> {currentStage.entreprise}</p>
            <p><strong>Dates :</strong> {new Date(currentStage.dateDebut).toLocaleDateString()} → {new Date(currentStage.dateFin).toLocaleDateString()}</p>
            <p><strong>Encadrant académique :</strong> {currentStage.acaPrenom} {currentStage.acaNom} (<a href={`mailto:${currentStage.acaEmail}`}>{currentStage.acaEmail}</a>)</p>
            <p><strong>Encadrant professionnel :</strong> {currentStage.proPrenom} {currentStage.proNom} (<a href={`mailto:${currentStage.proEmail}`}>{currentStage.proEmail}</a>)</p>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4">
        <Card.Header>Proposer un Sujet</Card.Header>
        <Card.Body>
          <Form>
            <Row><Col><Form.Control name="sujet" placeholder="Sujet" value={form.sujet} onChange={handleChange} /></Col></Row>
            <Row className="mt-2"><Col><Form.Control name="objectifs" placeholder="Objectifs" value={form.objectifs} onChange={handleChange} /></Col></Row>
            <Row className="mt-2">
              <Col><Form.Control type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} /></Col>
              <Col><Form.Control type="date" name="dateFin" value={form.dateFin} onChange={handleChange} /></Col>
            </Row>
            <Row className="mt-2">
              <Col><Form.Control name="encadrantAcademique" placeholder="Email Encadrant Académique" value={form.encadrantAcademique} onChange={handleChange} /></Col>
              <Col><Form.Control name="encadrantProfessionnel" placeholder="Email Encadrant Professionnel" value={form.encadrantProfessionnel} onChange={handleChange} /></Col>
            </Row>
            <Button className="mt-3" onClick={proposeStage}>Soumettre</Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Soumission du Rapport</Card.Header>
        <Card.Body>
          <Form.Group>
            <Form.Control type="file" accept="application/pdf,.doc,.docx" onChange={(e) => setRapport(e.target.files[0])} />
          </Form.Group>
          <Button className="mt-2" onClick={submitRapport}>Envoyer</Button>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Commentaires sur votre rapport</Card.Header>
        <Card.Body>
          {commentaires.length > 0 ? (
            <ul>
              {commentaires.map(c => (
                <li key={c.id}>
                  <strong>{new Date(c.date_envoi).toLocaleString()} :</strong> {c.commentaire}
                </li>
              ))}
            </ul>
          ) : <p>Aucun commentaire pour l’instant.</p>}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>Attestation</Card.Header>
        <Card.Body>
          <Button onClick={fetchAttestation}>Vérifier l'attestation</Button>
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
