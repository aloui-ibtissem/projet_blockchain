import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Alert, Spinner, Button } from "react-bootstrap";

function VerifyAttestation() {
  const { id } = useParams();
  const [status, setStatus] = useState("loading");
  const [ipfsUrl, setIpfsUrl] = useState(null);
  const [attestationInfo, setAttestationInfo] = useState(null);

  const fetchAttestation = async () => {
    try {
      const res = await fetch(`https://TON-NGROK-URL/api/attestation/verifier/${id}`);
      const data = await res.json();

      if (!data || data.error) {
        setStatus("error");
        return;
      }

      const ipfs = data.lienIPFS.replace("ipfs://", "https://ipfs.io/ipfs/");
      setIpfsUrl(ipfs);
      setAttestationInfo(data);
      setStatus("done");
    } catch (err) {
      console.error("Erreur de chargement de l'attestation:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (id) fetchAttestation();
    else setStatus("error");
  }, [id]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3">
      <Card className="w-100" style={{ maxWidth: "700px", padding: "30px" }}>
        <h2 className="text-center mb-4">Vérification de l'attestation</h2>

        {status === "loading" && (
          <div className="text-center text-secondary">
            <Spinner animation="border" size="sm" className="me-2" /> Chargement en cours...
          </div>
        )}

        {status === "error" && (
          <Alert variant="danger">
            Une erreur est survenue. Vérifiez l'identifiant ou la connexion.
          </Alert>
        )}

        {status === "done" && ipfsUrl && (
          <>
            <p><strong>Identifiant Attestation :</strong> {attestationInfo.identifiant}</p>
            <p><strong>Nom Étudiant :</strong> {attestationInfo.etudiantNom}</p>
            <p><strong>Identifiant Stage :</strong> {attestationInfo.identifiantStage}</p>
            <p><strong>Hash :</strong> <span className="small text-break">{attestationInfo.hash}</span></p>

            <Alert variant="success">
              Cette attestation est <strong>authentique</strong>, <strong>signée</strong> et hébergée sur <strong>IPFS</strong>.<br />
              Elle peut être consultée à tout moment via le QR code ou le lien ci-dessous.
            </Alert>

            <Button
              variant="outline-primary"
              href={ipfsUrl}
              target="_blank"
              className="mt-3"
            >
              Voir le fichier PDF original
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

export default VerifyAttestation;
