import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';

export function NotificationPanel({ notifications }) {
  return (
    <ListGroup>
      {notifications.map(n => (
        <ListGroup.Item key={n.id} className={!n.est_lu ? 'fw-bold' : ''}>
          {n.message}
          <Badge bg="secondary" className="float-end">
            {new Date(n.date_envoi).toLocaleDateString()}
          </Badge>
        </ListGroup.Item>
      ))}
      {notifications.length === 0 && (
        <ListGroup.Item className="text-muted">Aucune notification</ListGroup.Item>
      )}
    </ListGroup>
  );
}
