import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  FaUserCircle,
  FaUser,
  FaTachometerAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaBell,
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const {
    user,
    isAuthenticated,
    logout,
    pendingSwapCount,
  } = useContext(AuthContext);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        Skill <span>Swap</span>
      </Link>

      {/* Navigation Links */}
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/find-skills">Find Skills</Link>
        <Link to="/how-it-works">How it Works</Link>
      </div>

      {/* Right Side */}
      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            {/* Notification Bell */}
            <Link
              to="/swap-requests"
              className="notification-btn"
              title="Swap Requests"
            >
              <FaBell />

              {pendingSwapCount > 0 && (
                <span className="notification-badge">
                  {pendingSwapCount > 9 ? "9+" : pendingSwapCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div
              className="user-dropdown"
              ref={dropdownRef}
            >
              <button
                className="user-dropdown-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <FaUserCircle className="user-icon" />

                <span>{user?.name}</span>

                <FaChevronDown
                  className={`dropdown-arrow ${
                    dropdownOpen ? "rotate" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FaUser />
                    My Profile
                  </Link>

                  <Link
                    to="/dashboard"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FaTachometerAlt />
                    Dashboard
                  </Link>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="login-btn"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="signup-btn"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
