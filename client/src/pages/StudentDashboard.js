import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Alert } from 'react-bootstrap';
import './DashboardPage.css';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    program: '',
    internship: {
      company: '',
      subject: '',
      progress: 0,
      lastReportDate: '',
      status: ''
    },
    reports: [],
    meetings: [],
    notifications: []
  });

  useEffect(() => {
    // Simuler une récupération d'API
    const fetchData = async () => {
      const mockData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@university.edu',
        program: 'Computer Engineering',
        internship: {
          company: 'TechCorp Inc',
          subject: 'IoT Smart Home App',
          progress: 55,
          lastReportDate: '2025-03-20',
          status: 'Ongoing'
        },
        reports: [
          {
            id: 1,
            title: 'Initial Report',
            submissionDate: '2025-03-01',
            status: 'Submitted',
            feedback: 'Pending review'
          },
          {
            id: 2,
            title: 'Midterm Report',
            submissionDate: '2025-04-01',
            status: 'Draft',
            feedback: ''
          }
        ],
        meetings: [
          {
            id: 1,
            title: 'Supervisor Check-in',
            date: '2025-04-15',
            time: '10:00',
            location: 'Zoom',
            participants: ['John Doe', 'Dr. Smith']
          }
        ],
        notifications: [
          { id: 1, message: 'Your initial report was submitted', date: '2025-03-01', read: true },
          { id: 2, message: 'You have a meeting scheduled', date: '2025-04-10', read: false }
        ]
      };

      setStudentData(mockData);
    };

    fetchData();
  }, []);

  const unreadCount = studentData.notifications.filter(n => !n.read).length;

  return (
    <div className="dashboard-page student-dashboard">
      <Container fluid>
        {/* Header */}
        <Row className="dashboard-header">
          <Col>
            <h1>Student Dashboard</h1>
            <p>Welcome, {studentData.firstName} {studentData.lastName}</p>
          </Col>
        </Row>

        {/* Internship Summary */}
        <Row className="mb-4">
          <Col>
            <Card className="dashboard-card">
              <Card.Header as="h5">
                Internship Overview
              </Card.Header>
              <Card.Body>
                <p><strong>Company:</strong> {studentData.internship.company}</p>
                <p><strong>Subject:</strong> {studentData.internship.subject}</p>
                <p><strong>Status:</strong> {studentData.internship.status}</p>
                <p><strong>Last Report:</strong> {studentData.internship.lastReportDate}</p>
                <div className="progress mt-3">
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${studentData.internship.progress}%` }}
                    aria-valuenow={studentData.internship.progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {studentData.internship.progress}%
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Reports */}
        <Row className="mb-4">
          <Col>
            <Card className="dashboard-card">
              <Card.Header as="h5">Your Reports</Card.Header>
              <Card.Body>
                {studentData.reports.length > 0 ? (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Submission Date</th>
                        <th>Status</th>
                        <th>Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.reports.map(report => (
                        <tr key={report.id}>
                          <td>{report.title}</td>
                          <td>{report.submissionDate}</td>
                          <td>
                            <Badge bg={
                              report.status === 'Submitted' ? 'success' :
                              report.status === 'Draft' ? 'warning' : 'secondary'
                            }>
                              {report.status}
                            </Badge>
                          </td>
                          <td>{report.feedback || 'No feedback yet'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">No reports available.</Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Meetings */}
        <Row className="mb-4">
          <Col>
            <Card className="dashboard-card">
              <Card.Header as="h5">Upcoming Meetings</Card.Header>
              <Card.Body>
                {studentData.meetings.length > 0 ? (
                  studentData.meetings.map(meeting => (
                    <div key={meeting.id} className="mb-3">
                      <h5>{meeting.title}</h5>
                      <p><strong>Date:</strong> {meeting.date}</p>
                      <p><strong>Time:</strong> {meeting.time}</p>
                      <p><strong>Location:</strong> {meeting.location}</p>
                      <p><strong>Participants:</strong> {meeting.participants.join(', ')}</p>
                    </div>
                  ))
                ) : (
                  <Alert variant="info">No meetings scheduled.</Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Notifications */}
        <Row>
          <Col>
            <Card className="dashboard-card">
              <Card.Header as="h5">
                Notifications
                <Badge bg="danger" pill className="ms-2">{unreadCount}</Badge>
              </Card.Header>
              <Card.Body>
                {studentData.notifications.length > 0 ? (
                  studentData.notifications.map(notif => (
                    <Alert key={notif.id} variant={notif.read ? 'secondary' : 'primary'}>
                      <strong>{notif.date}:</strong> {notif.message}
                    </Alert>
                  ))
                ) : (
                  <Alert variant="info">No notifications.</Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StudentDashboard;
