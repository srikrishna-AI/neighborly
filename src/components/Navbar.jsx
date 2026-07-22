import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-accent">N</span>eighborly
        </Link>
        <div className="navbar-links flex items-center gap-4">
          <Link to="/listings" className="navbar-link">Browse</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              <Link to="/requests" className="navbar-link">My Requests</Link>
              <Link to="/messages" className="navbar-link">Messages</Link>
              <Link to={`/users/${user.id}`} className="navbar-link">Profile</Link>
              <button onClick={handleLogout} className="btn-logout">
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Log In</Link>
              <Link to="/register" className="btn-primary-small">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
