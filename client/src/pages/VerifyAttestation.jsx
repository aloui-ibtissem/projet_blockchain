import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { Card, Alert, Spinner, Button } from "react-bootstrap";
import abi from "./AttestationContractAbi.json";

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 

function VerifyAttestation() {
  const { id } = useParams();
  const [status, setStatus] = useState("loading");
  const [attestation, setAttestation] = useState(null);
  const [hashMatch, setHashMatch] = useState(null);

  const fetchBlockchainData = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545"); 
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      const data = await contract.getAttestation(id);

      //  Transforme le lien IPFS utilisable
      const ipfsUrl = `https://ipfs.io/ipfs/${data.fileHash}`;
      setAttestation({ ...data, ipfsUrl });

      //  Téléchargement du PDF depuis IPFS
      const response = await fetch(ipfsUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      setHashMatch(hashHex === data.fileHash.toLowerCase());
      setStatus("done");
    } catch (err) {
      console.error("Erreur de vérification:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (id) fetchBlockchainData();
    else setStatus("error");
  }, [id]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light px-3">
      <Card className="w-100" style={{ maxWidth: "700px", padding: "30px" }}>
        <h2 className="text-center mb-4">Vérification d'attestation</h2>

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

        {status === "done" && attestation && (
          <>
            <p><strong>Stage ID :</strong> {attestation.stageId}</p>
            <p><strong>Rapport ID :</strong> {attestation.reportId}</p>
            <p><strong>Hash attendu :</strong> <span className="small text-break">{attestation.fileHash}</span></p>

            <p className="mt-3">
              <strong>Statut :</strong><br />
              {hashMatch ? (
                <span className="text-success fw-bold"> Attestation authentique.</span>
              ) : (
                <span className="text-danger fw-bold"> Attestation falsifiée !</span>
              )}
            </p>

            <Button
              variant="outline-primary"
              href={attestation.ipfsUrl}
              target="_blank"
              className="mt-3"
            >
              Voir le fichier IPFS
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

export default VerifyAttestation;
