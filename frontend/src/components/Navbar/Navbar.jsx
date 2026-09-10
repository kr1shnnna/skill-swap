import { Link, useNavigate } from "react-router-dom";

import {
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

import { AuthContext } from "../../context/AuthContext";

import {
  FaUserCircle,
  FaUser,
  FaTachometerAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaBell,
  FaComments,
} from "react-icons/fa";

import "./Navbar.css";

const Navbar = () => {
  const {
    user,
    isAuthenticated,
    logout,
    pendingSwapCount,
    unreadMessageCount,
  } = useContext(AuthContext);

  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  /*
   * ------------------------------------------
   * LOGOUT
   * ------------------------------------------
   */

  const handleLogout = () => {
    logout();

    setDropdownOpen(false);

    navigate("/");
  };

  /*
   * ------------------------------------------
   * CLOSE DROPDOWN WHEN CLICKING OUTSIDE
   * ------------------------------------------
   */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
   * ------------------------------------------
   * UI
   * ------------------------------------------
   */

  return (
    <nav className="navbar">

      {/* ====================================== */}
      {/* LOGO */}
      {/* ====================================== */}

      <Link
        to="/"
        className="navbar-logo"
      >
        Skill <span>Swap</span>
      </Link>

      {/* ====================================== */}
      {/* NAVIGATION LINKS */}
      {/* ====================================== */}

      <div className="navbar-links">

        <Link to="/">
          Home
        </Link>

        <Link to="/find-skills">
          Find Skills
        </Link>

        <Link to="/how-it-works">
          How it Works
        </Link>

      </div>

      {/* ====================================== */}
      {/* RIGHT SIDE */}
      {/* ====================================== */}

      <div className="navbar-actions">

        {isAuthenticated ? (

          <>

            {/* ================================= */}
            {/* CHAT NOTIFICATION */}
            {/* ================================= */}

            <Link
              to="/chat"
              className="notification-btn"
              title="Messages"
            >

              <FaComments />

              {unreadMessageCount > 0 && (
                <span className="notification-badge">
                  {unreadMessageCount > 9
                    ? "9+"
                    : unreadMessageCount}
                </span>
              )}

            </Link>

            {/* ================================= */}
            {/* SWAP REQUEST NOTIFICATION */}
            {/* ================================= */}

            <Link
              to="/swap-requests"
              className="notification-btn"
              title="Swap Requests"
            >

              <FaBell />

              {pendingSwapCount > 0 && (
                <span className="notification-badge">
                  {pendingSwapCount > 9
                    ? "9+"
                    : pendingSwapCount}
                </span>
              )}

            </Link>

            {/* ================================= */}
            {/* USER DROPDOWN */}
            {/* ================================= */}

            <div
              className="user-dropdown"
              ref={dropdownRef}
            >

              <button
                className="user-dropdown-btn"
                onClick={() =>
                  setDropdownOpen(
                    !dropdownOpen
                  )
                }
              >

                <FaUserCircle className="user-icon" />

                <span>
                  {user?.name}
                </span>

                <FaChevronDown
                  className={`dropdown-arrow ${
                    dropdownOpen
                      ? "rotate"
                      : ""
                  }`}
                />

              </button>

              {/* ================================= */}
              {/* DROPDOWN MENU */}
              {/* ================================= */}

              {dropdownOpen && (

                <div className="dropdown-menu">

                  {/* Profile */}

                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() =>
                      setDropdownOpen(false)
                    }
                  >

                    <FaUser />

                    My Profile

                  </Link>

                  {/* Dashboard */}

                  <Link
                    to="/dashboard"
                    className="dropdown-item"
                    onClick={() =>
                      setDropdownOpen(false)
                    }
                  >

                    <FaTachometerAlt />

                    Dashboard

                  </Link>

                  {/* Divider */}

                  <div className="dropdown-divider"></div>

                  {/* Logout */}

                  <button
                    className="dropdown-item logout-item"
                    onClick={
                      handleLogout
                    }
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

            {/* ================================= */}
            {/* LOGIN */}
            {/* ================================= */}

            <Link
              to="/login"
              className="login-btn"
            >
              Login
            </Link>

            {/* ================================= */}
            {/* SIGN UP */}
            {/* ================================= */}

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
