import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ToastContainer from './components/Toast';
import Footer from './components/Footer';
import PageWrapper from './components/PageWrapper';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BookingForm from './pages/BookingForm';
import Confirmation from './pages/Confirmation';
import PlumberList from './pages/PlumberList';
import PlumberProfile from './pages/PlumberProfile';
import BookingDetail from './pages/BookingDetail';
import CustomerDashboard from './pages/CustomerDashboard';
import PlumberDashboard from './pages/PlumberDashboard';

const DashboardResolver = () => {
  const { user } = useAuth();
  if (user?.role === 'plumber') return <PlumberDashboard />;
  return <CustomerDashboard />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
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
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['customer', 'plumber']}>
            <PageWrapper><DashboardResolver /></PageWrapper>
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
      </Routes>
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
