// src/pages/TierUniDashboard.jsx
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';
import './DashboardTierUni.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

function TierUniDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const [rapports, setRapports] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || role !== 'TierDebloqueur') {
      navigate('/login');
      return;
    }
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      navigate('/login');
      return;
    }
    fetchRapports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRapports = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/rapport/tiers-universite`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRapports(Array.isArray(data) ? data : []);
      setMessage('');
    } catch (err) {
      console.warn(err);
      setRapports([]);
      setMessage('Erreur récupération.');
    } finally {
      setLoading(false);
    }
  };

  const validerRapport = async id => {
    try {
      await axios.post(
        `${API_URL}/api/rapport/valider-tier`,
        { rapportId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Rapport validé.');
      fetchRapports();
    } catch {
      setMessage('Échec de validation.');
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={11} lg={10}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Espace Universitaire (Tier)</h5>
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="info">{message}</Alert>}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : rapports.length > 0 ? (
                <Table responsive bordered className="text-center">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>ID Étudiant</th>
                      <th>Période de Stage</th>
                      <th>Date Soumission</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rapports.map((r, i) => (
                      <tr key={r.rapportId}>
                        <td>{i + 1}</td>
                        <td>{`ETU-${String(r.rapportId).padStart(4, '0')}`}</td>
                        <td>
                          {new Date(r.dateDebut).toLocaleDateString()} →{' '}
                          {new Date(r.dateFin).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(r.dateSoumission).toLocaleDateString()}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => validerRapport(r.rapportId)}
                          >
                            Valider
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-center text-muted">
                  Aucun rapport à valider.
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TierUniDashboard;
