// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthProvider, useAuth } from './AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import AcademicSupervisorDashboard from './pages/AcademicSupervisorDashboard';
import NotFoundPage from './pages/NotFoundPage';

// Composants
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';

// CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

/**
 * Composant de route protégée qui vérifie l'authentification et le rôle
 */
const ProtectedRoute = ({ element, roles }) => {
  const { currentUser, loading } = useAuth();
  
  // Afficher un spinner pendant le chargement
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Vérifier si l'utilisateur est connecté
  if (!currentUser) {
    return <Navigate to="/connexion" replace />;
  }
  
  // Vérifier si l'utilisateur a le rôle requis
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return element;
};

/**
 * Composant de redirection vers le tableau de bord approprié selon le rôle
 */
const DashboardRouter = () => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!currentUser) {
    return <Navigate to="/connexion" replace />;
  }
  
  // Rediriger vers le tableau de bord approprié selon le rôle
  switch (currentUser.role) {
    case 'etudiant':
      return <Navigate to="/dashboard/etudiant" replace />;
    case 'encadrantAcademique':
      return <Navigate to="/dashboard/encadrant-academique" replace />;
    default:
      return <Navigate to="/connexion" replace />;
  }
};

/**
 * Composant principal de l'application
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container d-flex flex-column min-vh-100">
          <Navigation />
          
          <main className="flex-grow-1">
            <Container fluid className="p-0">
              <Routes>
                {/* Routes publiques */}
                <Route path="/" element={<HomePage />} />
                <Route path="/connexion" element={<LoginPage />} />
                <Route path="/inscription" element={<RegisterPage />} />
                
                {/* Route de redirection vers le tableau de bord approprié */}
                <Route path="/dashboard" element={<DashboardRouter />} />
                
                {/* Routes protégées pour les tableaux de bord spécifiques aux rôles */}
                <Route 
                  path="/dashboard/etudiant" 
                  element={
                    <ProtectedRoute 
                      element={<StudentDashboard />} 
                      roles={['etudiant']} 
                    />
                  } 
                />
                
                <Route 
                  path="/dashboard/encadrant-academique" 
                  element={
                    <ProtectedRoute 
                      element={<AcademicSupervisorDashboard />} 
                      roles={['encadrantAcademique']} 
                    />
                  } 
                />
                
                {/* Route 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Container>
          </main>
          
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
