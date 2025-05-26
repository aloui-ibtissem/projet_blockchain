import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, Alert, Spinner } from "react-bootstrap";

const VerifierAttestation = () => {
  const { identifiant } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/attestation/verifier/${identifiant}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (identifiant) fetchData();
    else setError("Identifiant manquant dans l'URL.");
  }, [identifiant]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-4">
      <Card className="w-100" style={{ maxWidth: "700px", padding: "30px" }}>
        <h2 className="text-center mb-4">Vérification d'attestation</h2>

        {loading && (
          <div className="text-center text-secondary">
            <Spinner animation="border" size="sm" className="me-2" />
            Chargement des données...
          </div>
        )}

        {error && (
          <Alert variant="danger">
            <Alert.Heading>Erreur</Alert.Heading>
            <p>{error}</p>
          </Alert>
        )}

        {data && (
          <div className="mt-3">
            <p><strong>Étudiant :</strong> {data.etudiantNom}</p>
            <p><strong>Stage :</strong> {data.identifiantStage}</p>
            <p><strong>Hash SHA-256 :</strong></p>
            <div className="bg-light border p-2 rounded text-break small">{data.hash}</div>
            <p className="mt-3"><strong>Lien IPFS :</strong> <br />
              <a href={data.lienIPFS} target="_blank" rel="noreferrer">{data.lienIPFS}</a>
            </p>
            <div className="text-success mt-3 fw-bold"> Attestation vérifiée avec succès</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VerifierAttestation;
