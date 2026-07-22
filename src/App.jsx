import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BrowseListingsPage from './pages/BrowseListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import CreateEditListingPage from './pages/CreateEditListingPage';
import MyRequestsPage from './pages/MyRequestsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/listings" element={<BrowseListingsPage />} />
                <Route path="/listings/:id" element={<ListingDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/users/:id" element={<ProfilePage />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listings/new"
                  element={
                    <ProtectedRoute>
                      <CreateEditListingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listings/:id/edit"
                  element={
                    <ProtectedRoute>
                      <CreateEditListingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/requests"
                  element={
                    <ProtectedRoute>
                      <MyRequestsPage />
                    </ProtectedRoute>
                  }
                />

              </Routes>
            </main>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
