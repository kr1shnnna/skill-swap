import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaUserCircle } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        Skill <span>Swap</span>
      </Link>

      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/find-skills">Find Skills</Link>
        <Link to="/how-it-works">How it Works</Link>
      </div>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            <div className="user-info">
              <FaUserCircle className="user-icon" />

              <span>{user?.name}</span>
            </div>

            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-btn">
              Login
            </Link>

            <Link to="/register" className="signup-btn">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;