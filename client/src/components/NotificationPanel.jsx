import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';

export function NotificationPanel({ notifications }) {
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <ListGroup>
      {safeNotifications.length > 0 ? (
        safeNotifications.map(n => (
          <ListGroup.Item key={n.id} className={!n.est_lu ? 'fw-bold' : ''}>
            {n.message}
            <Badge bg="secondary" className="float-end">
              {new Date(n.date_envoi).toLocaleDateString()}
            </Badge>
          </ListGroup.Item>
        ))
      ) : (
        <ListGroup.Item className="text-muted">Aucune notification</ListGroup.Item>
      )}
    </ListGroup>
  );
}
