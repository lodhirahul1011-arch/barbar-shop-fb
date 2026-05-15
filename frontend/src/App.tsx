import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import CustomerDashboard from './pages/customer/Dashboard';
import OwnerDashboard from './pages/owner/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgetPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import BookingFlow from './pages/customer/BookingFlow';
import ReschedulePage from './pages/customer/ReschedulePage';
import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';
import Support from './pages/Support';
import Contact from './pages/Contact';
import Tracking from './pages/customer/Tracking';
import About from './pages/About';
import Barbers from './pages/Barbers';
import Pricing from './pages/Pricing';
import Navbar from './components/Navbar';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    const nextPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }
  if (roles && profile && !roles.includes(profile.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen">
            <Navbar />
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/team" element={<Barbers />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Customer Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/book/:shopId" element={
              <ProtectedRoute roles={['customer']}>
                <BookingFlow />
              </ProtectedRoute>
            } />
            <Route path="/reschedule/:appointmentId" element={
              <ProtectedRoute roles={['customer']}>
                <ReschedulePage />
              </ProtectedRoute>
            } />
            <Route path="/tracking/:appointmentId" element={
              <ProtectedRoute roles={['customer']}>
                <Tracking />
              </ProtectedRoute>
            } />
            
            {/* Legal & Support */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/support" element={<Support />} />
            <Route path="/contact" element={<Contact />} />

            {/* Owner Routes */}
            <Route path="/owner/*" element={
              <ProtectedRoute roles={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
