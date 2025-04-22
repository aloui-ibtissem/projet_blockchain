// src/pages/VerifyEmailPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

function VerifyEmailPage() {
  const [message, setMessage] = useState("Validation en cours...");

  useEffect(() => {
    const token = window.location.pathname.split("/").pop();

    axios.get(`http://localhost:3000/api/auth/verify/${token}`)
      .then((res) => {
        setMessage(" Email confirmé ! Vous pouvez maintenant vous connecter.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      })
      .catch(() => {
        setMessage(" Ce lien de validation est invalide ou expiré.");
      });
  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>{message}</h2>
    </div>
  );
}

export default VerifyEmailPage;
