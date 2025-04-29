import React, { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { Form, Button, Alert, Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Etudiant");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (!window.ethereum) {
        setErrorMessage("Veuillez installer MetaMask !");
        setLoading(false);
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const message = `Connexion:${email}:${role}:123456`;
      const signature = await signer.signMessage(message);

      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        role,
        signature,
      });

      if (res.data.success) {
        const token = res.data.token;
        const userRole = res.data.role;

        localStorage.setItem("token", token);
        localStorage.setItem("role", userRole);

        if (onLogin) onLogin(token, userRole);

        setSuccessMessage("Connexion réussie !");
        setTimeout(() => {
          switch (userRole) {
            case "Etudiant":
              navigate("/etudiant");
              break;
            case "EncadrantAcademique":
              navigate("/encAca");
              break;
            case "EncadrantProfessionnel":
              navigate("/encPro");
              break;
            case "ResponsableUniversite":
              navigate("/respUniv");
              break;
            case "ResponsableEntreprise":
              navigate("/respEnt");
              break;
            case "TierDebloqueur":
              navigate("/tier");
              break;
            default:
              navigate("/");
          }
        }, 800);
      } else {
        setErrorMessage(res.data.error || "Erreur lors de la connexion.");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setErrorMessage("Erreur : " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="p-4 shadow-sm">
            <h2 className="mb-4 text-center">Connexion</h2>

            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}

            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Rôle</Form.Label>
                <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option>Etudiant</option>
                  <option>EncadrantAcademique</option>
                  <option>EncadrantProfessionnel</option>
                  <option>ResponsableUniversite</option>
                  <option>ResponsableEntreprise</option>
                  <option>TierDebloqueur</option>
                </Form.Select>
              </Form.Group>

              <Button variant="success" className="w-100" onClick={handleLogin} disabled={loading}>
                {loading ? "Connexion..." : "Se connecter avec MetaMask"}
              </Button>
            </Form>

            <div className="text-center mt-3">
              <a href="/register">Pas encore inscrit ? S'inscrire</a>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;
