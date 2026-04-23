import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ToastContainer from './components/Toast';

import PageWrapper from './components/PageWrapper';
import ProtectedRoute from './routes/ProtectedRoute';

// Lazy load pages for Code Splitting
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const BookingForm = lazy(() => import('./pages/BookingForm'));
const Confirmation = lazy(() => import('./pages/Confirmation'));
const PlumberList = lazy(() => import('./pages/PlumberList'));
const PlumberProfile = lazy(() => import('./pages/PlumberProfile'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const PlumberDashboard = lazy(() => import('./pages/PlumberDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const PlumberProfileSettings = lazy(() => import('./pages/PlumberProfileSettings'));
const PlumberReviews = lazy(() => import('./pages/PlumberReviews'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const DashboardResolver = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'plumber') return <PlumberDashboard />;
  return <CustomerDashboard />;
};

const ProfileResolver = () => {
  const { user } = useAuth();
  if (user?.role === 'plumber') return <PlumberProfileSettings />;
  return <Profile />;
};

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div className="spinner"></div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
          <Route path="/reset-password/:token" element={<PageWrapper><ResetPassword /></PageWrapper>} />
          <Route path="/plumbers" element={<PageWrapper><PlumberList /></PageWrapper>} />
          <Route path="/plumbers/:id" element={<PageWrapper><PlumberProfile /></PageWrapper>} />

          {/* Protected routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute roles={['customer', 'plumber']}>
              <PageWrapper><ProfileResolver /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['customer', 'plumber']}>
              <PageWrapper><DashboardResolver /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/plumber-reviews" element={
            <ProtectedRoute roles={['plumber']}>
              <PageWrapper><PlumberReviews /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/booking" element={
            <ProtectedRoute roles={['customer']}>
              <PageWrapper><BookingForm /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/confirmation" element={
            <ProtectedRoute roles={['customer']}>
              <PageWrapper><Confirmation /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/bookings/:id" element={
            <ProtectedRoute roles={['customer', 'plumber']}>
              <PageWrapper><BookingDetail /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Catch-all — redirect unknown paths */}
          <Route path="*" element={<PageWrapper><Home /></PageWrapper>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <div className="app-container">
            <Navbar />
            <main>
              <AnimatedRoutes />
            </main>
          </div>
          <ToastContainer />
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
