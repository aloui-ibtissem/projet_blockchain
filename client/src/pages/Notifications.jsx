import React, { useEffect, useState } from "react";
import axios from "axios";

function Notifications({ token }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/stage/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Erreur récupération notifications", err);
      }
    };
    fetch();
  }, [token]);

  return (
    <div className="notifications-container">
      <h3>Vos Notifications</h3>
      <ul>
        {notifications.map(n => (
          <li key={n.id}>
            {n.message} – <small>{new Date(n.date_envoi).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;
