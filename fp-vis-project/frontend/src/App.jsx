import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from '@mui/material';
import Login from './pages/Login';
import VisitorRegistration from './pages/VisitorRegistration';
import AdminDashboard from './pages/AdminDashboard';
import GuardScanner from './pages/GuardScanner';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import { useAuthStore } from './store/authStore';

function App() {
  const { user } = useAuthStore();

  return (
    <>
      {user && <Navigation />}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<VisitorRegistration />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <PrivateRoute>
                <GuardScanner />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/register" />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
