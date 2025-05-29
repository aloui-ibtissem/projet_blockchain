// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardEtudiant from './pages/DashboardEtudiant';
import DashboardEncadrantAca from './pages/DashboardEncadrantAca';
import DashboardEncadrantPro from './pages/DashboardEncadrantPro';
import DashboardRespUniversitaire from './pages/DashboardRespUniversitaire';
import DashboardRespEntreprise from './pages/DashboardRespEntreprise';
import DashboardTierUni from './pages/TierUniDashboard';  
import DashboardTierEnt from './pages/TierEntDashboard';  
import VerifiedPage from './pages/VerifiedPage';


import Navigation from './components/Navigation';
import Footer from './components/Footer';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import Notifications from "./pages/Notifications";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  // Sync state with localStorage on login
  const handleLogin = (tokenFromLogin, roleFromLogin) => {
    localStorage.setItem("token", tokenFromLogin);
    localStorage.setItem("role", roleFromLogin);
    setToken(tokenFromLogin);
    setRole(roleFromLogin);
  };

  return (
    <Router>
      <div className="app-container d-flex flex-column min-vh-100">
        <Navigation />

        <main className="flex-grow-1">
          <Container fluid className="p-0">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

              <Route path="/etudiant" element={<DashboardEtudiant token={token} />} />
              <Route path="/encAca" element={<DashboardEncadrantAca token={token} />} />
              <Route path="/encPro" element={<DashboardEncadrantPro token={token} />} />
              <Route path="/respUniv" element={<DashboardRespUniversitaire token={token} />} />
              <Route path="/respEnt" element={<DashboardRespEntreprise token={token} />} />
              <Route path="/tierUni" element={<DashboardTierUni token={token} />} /> 
              <Route path="/tierEnt" element={<DashboardTierEnt token={token} />} /> 


              <Route path="*" element={<Navigate to="/" replace />} />
              <Route path="/verified" element={<VerifiedPage />} />



              
              <Route path="/notifications" element={<Notifications token={token} />} />


            </Routes>
          </Container>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;

