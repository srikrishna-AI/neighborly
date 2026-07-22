import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and remember the originally requested URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
