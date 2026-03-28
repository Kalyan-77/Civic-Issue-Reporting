import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Loading from './Components/Loading';

const Login = lazy(() => import('./Auth/Login'));
const Register = lazy(() => import('./Auth/Register'));
const ForgotPassword = lazy(() => import('./Auth/ForgotPassword'));
const Home = lazy(() => import('./Components/Home'));
const UserDashboard = lazy(() => import('./Components/UserDashboard'));
const Dashboard = lazy(() => import('./Pages/dashboard'));
const AdminDashboard = lazy(() => import('./Components/AdminDashboard'));
const SuperAdmin = lazy(() => import('./Components/SuperAdmin'));

import { ThemeProvider } from './Context/ThemeContext';
// Note: ProtectedRoute is used as a component wrapper, not a lazy route itself. 
// I will keep its import synchronous to avoid logic delays, but lazy load its children.
import ProtectedRouteSync from './Components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Citizen-only routes */}
            <Route
              path="/citizen/*"
              element={
                <ProtectedRouteSync allowedRoles={['citizen']}>
                  <UserDashboard />
                </ProtectedRouteSync>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRouteSync allowedRoles={['citizen']}>
                  <Dashboard />
                </ProtectedRouteSync>
              }
            />

            {/* Department Admin-only routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRouteSync allowedRoles={['dept_admin']}>
                  <AdminDashboard />
                </ProtectedRouteSync>
              }
            />

            {/* Super Admin-only routes */}
            <Route
              path="/superadmin/*"
              element={
                <ProtectedRouteSync allowedRoles={['super_admin']}>
                  <SuperAdmin />
                </ProtectedRouteSync>
              }
            />

            {/* Home Page (public) */}
            <Route path="/*" element={<Home />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
