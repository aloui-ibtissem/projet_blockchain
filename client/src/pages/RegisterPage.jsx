import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import {
  Container,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Card,
  Spinner
} from "react-bootstrap";
import "./RegisterPage.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

function RegisterPage() {
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    role: "Etudiant",
    structureType: "",
    universiteId: "",
    entrepriseId: ""
  });
  const [universites, setUniversites] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [unis, ents] = await Promise.all([
          axios.get(`${API_URL}/universites`),
          axios.get(`${API_URL}/entreprises`)
        ]);
        setUniversites(unis.data);
        setEntreprises(ents.data);
      } catch (err) {
        console.error("Chargement universités/entreprises", err);
      }
    })();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);
    try {
      if (!form.email || !form.role) {
        setErrorMessage("Email et rôle requis.");
        return;
      }
      if (!window.ethereum) {
        setErrorMessage("Installez MetaMask.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const message = `Inscription:${form.email}:${form.role}:123456`;
      const signature = await signer.signMessage(message);

      const payload = {
        ...form,
        structureType:
          form.role === "Etudiant" ? "universite" : form.structureType,
        signature
      };

      const res = await axios.post(
        `${API_URL}/api/auth/register-request`,
        payload
      );
      if (res.data.success) {
        setSuccessMessage(
          "Vérifiez votre boîte mail pour confirmer votre compte."
        );
      } else {
        setErrorMessage(res.data.error || "Erreur lors de l’inscription.");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const showStructureType = form.role === "TierDebloqueur";
  const showUniversite =
    ["Etudiant", "EncadrantAcademique", "ResponsableUniversitaire"].includes(
      form.role
    ) ||
    (form.role === "TierDebloqueur" &&
      form.structureType === "universite");
  const showEntreprise =
    ["EncadrantProfessionnel", "ResponsableEntreprise"].includes(form.role) ||
    (form.role === "TierDebloqueur" &&
      form.structureType === "entreprise");

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="p-4 shadow-sm">
            <h2 className="text-center mb-4">Créer un compte</h2>
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            {successMessage && (
              <Alert variant="success">{successMessage}</Alert>
            )}
            <Form>
              {/* Prénom */}
              <Form.Group className="mb-3">
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              {/* Nom */}
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              {/* Email */}
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              {/* Rôle */}
              <Form.Group className="mb-3">
                <Form.Label>Rôle</Form.Label>
                <Form.Select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option>Etudiant</option>
                  <option>EncadrantAcademique</option>
                  <option>EncadrantProfessionnel</option>
                  <option>ResponsableUniversitaire</option>
                  <option>ResponsableEntreprise</option>
                  <option>TierDebloqueur</option>
                </Form.Select>
              </Form.Group>
              {/* Type de structure */}
              {showStructureType && (
                <Form.Group className="mb-3">
                  <Form.Label>Type de structure</Form.Label>
                  <Form.Select
                    name="structureType"
                    value={form.structureType}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionnez</option>
                    <option value="universite">Université</option>
                    <option value="entreprise">Entreprise</option>
                  </Form.Select>
                </Form.Group>
              )}
              {/* Université */}
              {showUniversite && (
                <Form.Group className="mb-3">
                  <Form.Label>Université</Form.Label>
                  <Form.Select
                    name="universiteId"
                    value={form.universiteId}
                    onChange={handleChange}
                  >
                    <option value="">Choisir</option>
                    {universites.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nom}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              {/* Entreprise */}
              {showEntreprise && (
                <Form.Group className="mb-3">
                  <Form.Label>Entreprise</Form.Label>
                  <Form.Select
                    name="entrepriseId"
                    value={form.entrepriseId}
                    onChange={handleChange}
                  >
                    <option value="">Choisir</option>
                    {entreprises.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nom}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              <Button
                className="w-100"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm"/>
                ) : (
                  "S'inscrire avec MetaMask"
                )}
              </Button>
            </Form>
            <div className="text-center mt-3">
              <a href="/login">J’ai déjà un compte</a>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RegisterPage;
