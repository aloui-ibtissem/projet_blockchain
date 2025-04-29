import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { Container, Form, Button, Alert, Row, Col, Card } from "react-bootstrap";
import "./RegisterPage.css";

function RegisterPage() {
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    role: "Etudiant",
    structureType: "",
    universiteId: "",
    entrepriseId: "",
  });

  const [universites, setUniversites] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unis, ents] = await Promise.all([
          axios.get("http://localhost:3000/universites"),
          axios.get("http://localhost:3000/entreprises"),
        ]);
        setUniversites(unis.data);
        setEntreprises(ents.data);
      } catch (err) {
        console.error("Erreur chargement Universités/Entreprises", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (!form.email || !form.role) {
        setErrorMessage("Veuillez saisir un email et un rôle.");
        setLoading(false);
        return;
      }

      if (!window.ethereum) {
        setErrorMessage("Veuillez installer MetaMask !");
        setLoading(false);
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const message = `Inscription:${form.email}:${form.role}:123456`;
      const signature = await signer.signMessage(message);

      const payload = { ...form, signature };

      const res = await axios.post("http://localhost:3000/api/auth/register-request", payload);

      if (res.data.success) {
        setSuccessMessage("Email de vérification envoyé !");
      } else {
        setErrorMessage(res.data.error || "Erreur lors de l'inscription.");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const showOrganisme = ["Etudiant", "EncadrantAcademique", "ResponsableUniversite", "EncadrantProfessionnel", "ResponsableEntreprise", "TierDebloqueur"].includes(form.role);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="p-4 shadow-sm">
            <h2 className="mb-4 text-center">Créer un compte</h2>

            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}

            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Prénom</Form.Label>
                <Form.Control type="text" name="prenom" value={form.prenom} onChange={handleChange} required />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control type="text" name="nom" value={form.nom} onChange={handleChange} required />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" name="email" value={form.email} onChange={handleChange} required />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Rôle</Form.Label>
                <Form.Select name="role" value={form.role} onChange={handleChange}>
                  <option>Etudiant</option>
                  <option>EncadrantAcademique</option>
                  <option>EncadrantProfessionnel</option>
                  <option>ResponsableUniversite</option>
                  <option>ResponsableEntreprise</option>
                  <option>TierDebloqueur</option>
                </Form.Select>
              </Form.Group>

              {form.role === "TierDebloqueur" && (
                <Form.Group className="mb-3">
                  <Form.Label>Type de structure</Form.Label>
                  <Form.Select name="structureType" value={form.structureType} onChange={handleChange}>
                    <option value="">Sélectionner</option>
                    <option value="universite">Université</option>
                    <option value="entreprise">Entreprise</option>
                  </Form.Select>
                </Form.Group>
              )}

              {showOrganisme && form.structureType === "universite" && (
                <Form.Group className="mb-3">
                  <Form.Label>Université</Form.Label>
                  <Form.Select name="universiteId" value={form.universiteId} onChange={handleChange}>
                    <option value="">Choisir</option>
                    {universites.map((u) => (
                      <option key={u.id} value={u.id}>{u.nom}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {showOrganisme && form.structureType === "entreprise" && (
                <Form.Group className="mb-3">
                  <Form.Label>Entreprise</Form.Label>
                  <Form.Select name="entrepriseId" value={form.entrepriseId} onChange={handleChange}>
                    <option value="">Choisir</option>
                    {entreprises.map((e) => (
                      <option key={e.id} value={e.id}>{e.nom}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <Button variant="primary" className="w-100" onClick={handleRegister} disabled={loading}>
                {loading ? "Connexion à MetaMask..." : "S'inscrire avec MetaMask"}
              </Button>
            </Form>

            <div className="text-center mt-3">
              <a href="/login">Déjà inscrit ? Se connecter</a>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RegisterPage;
