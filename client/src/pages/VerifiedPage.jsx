import React from "react";
import { Button, Container, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function VerifiedPage() {
  const navigate = useNavigate();

  return (
    <Container className="py-5">
      <Card className="p-4 text-center shadow-sm">
        <h3 className="mb-3"> Adresse vérifiée avec succès</h3>
        <p>Vous pouvez maintenant vous connecter à la plateforme StageChain.</p>
        <Button variant="primary" onClick={() => navigate("/login")}>
          Accéder à la connexion
        </Button>
      </Card>
    </Container>
  );
}

export default VerifiedPage;
