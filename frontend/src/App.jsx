import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './Auth/Login';
import Register from './Auth/Register';
import ForgotPassword from './Auth/ForgotPassword';
import Home from './Components/Home';
import UserDashboard from './Components/UserDashboard';
import Dashboard from './Pages/dashboard';
import ProtectedRoute from './Components/ProtectedRoute';
import AdminDashboard from './Components/AdminDashboard';
import SuperAdmin from './Components/SuperAdmin';

import { ThemeProvider } from './Context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Home Page (public) */}
          <Route path="/*" element={<Home />} />

          {/* Citizen-only routes */}
          <Route
            path="/citizen/*"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Department Admin-only routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['dept_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Super Admin-only routes */}
          <Route
            path="/superadmin/*"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdmin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
