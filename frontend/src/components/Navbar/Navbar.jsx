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
  FaBars,
  FaTimes,
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

  const [mobileMenuOpen, setMobileMenuOpen] =
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
    setMobileMenuOpen(false);

    navigate("/");
  };


  /*
   * ------------------------------------------
   * HOW IT WORKS
   * ------------------------------------------
   */

  const handleHowItWorks = () => {
    setMobileMenuOpen(false);

    /*
     * If already on Home page,
     * directly scroll to the section.
     */

    if (window.location.pathname === "/") {
      const section =
        document.getElementById("how-it-works");

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return;
    }

    /*
     * If on another page, first go Home.
     * The Home page will then scroll
     * to the How It Works section.
     */

    navigate("/");

    setTimeout(() => {
      const section =
        document.getElementById("how-it-works");

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
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
   * CLOSE MOBILE MENU ON DESKTOP
   * ------------------------------------------
   */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);


  /*
   * ------------------------------------------
   * CLOSE MOBILE MENU
   * ------------------------------------------
   */

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };


  /*
   * ------------------------------------------
   * TOGGLE MOBILE MENU
   * ------------------------------------------
   */

  const toggleMobileMenu = () => {
    setMobileMenuOpen(
      (previous) => !previous
    );
  };


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
        onClick={closeMobileMenu}
      >
        Skill <span>Swap</span>
      </Link>


      {/* ====================================== */}
      {/* DESKTOP NAVIGATION */}
      {/* ====================================== */}

      <div className="navbar-links">

        <Link
          to="/"
          onClick={closeMobileMenu}
        >
          Home
        </Link>

        <Link
          to="/find-skills"
          onClick={closeMobileMenu}
        >
          Find Skills
        </Link>

        <button
          type="button"
          className="navbar-link-button"
          onClick={handleHowItWorks}
        >
          How it Works
        </button>

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


              {/* ============================= */}
              {/* DROPDOWN */}
              {/* ============================= */}

              {dropdownOpen && (
                <div className="dropdown-menu">

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


                  <div className="dropdown-divider"></div>


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


      {/* ====================================== */}
      {/* MOBILE MENU BUTTON */}
      {/* ====================================== */}

      <button
        className="mobile-menu-btn"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? (
          <FaTimes />
        ) : (
          <FaBars />
        )}
      </button>


      {/* ====================================== */}
      {/* MOBILE MENU */}
      {/* ====================================== */}

      {mobileMenuOpen && (
        <div className="mobile-menu">

          <div className="mobile-menu-links">

            <Link
              to="/"
              onClick={closeMobileMenu}
            >
              Home
            </Link>


            <Link
              to="/find-skills"
              onClick={closeMobileMenu}
            >
              Find Skills
            </Link>


            <button
              type="button"
              className="mobile-nav-link-button"
              onClick={handleHowItWorks}
            >
              How it Works
            </button>

          </div>


          {/* ================================= */}
          {/* MOBILE AUTHENTICATED ACTIONS */}
          {/* ================================= */}

          {isAuthenticated ? (
            <div className="mobile-user-section">

              <div className="mobile-user-info">

                <FaUserCircle />

                <div>
                  <strong>
                    {user?.name}
                  </strong>

                  <span>
                    SkillSwap Student
                  </span>
                </div>

              </div>


              <Link
                to="/chat"
                className="mobile-action-link"
                onClick={closeMobileMenu}
              >
                <FaComments />

                <span>
                  Messages
                </span>

                {unreadMessageCount > 0 && (
                  <span className="mobile-badge">
                    {unreadMessageCount > 9
                      ? "9+"
                      : unreadMessageCount}
                  </span>
                )}
              </Link>


              <Link
                to="/swap-requests"
                className="mobile-action-link"
                onClick={closeMobileMenu}
              >
                <FaBell />

                <span>
                  Swap Requests
                </span>

                {pendingSwapCount > 0 && (
                  <span className="mobile-badge">
                    {pendingSwapCount > 9
                      ? "9+"
                      : pendingSwapCount}
                  </span>
                )}
              </Link>


              <Link
                to="/profile"
                className="mobile-action-link"
                onClick={closeMobileMenu}
              >
                <FaUser />

                <span>
                  My Profile
                </span>
              </Link>


              <Link
                to="/dashboard"
                className="mobile-action-link"
                onClick={closeMobileMenu}
              >
                <FaTachometerAlt />

                <span>
                  Dashboard
                </span>
              </Link>


              <button
                className="mobile-action-link mobile-logout"
                onClick={
                  handleLogout
                }
              >
                <FaSignOutAlt />

                <span>
                  Logout
                </span>
              </button>

            </div>
          ) : (
            /* ================================= */
            /* MOBILE GUEST ACTIONS */
            /* ================================= */

            <div className="mobile-auth-buttons">

              <Link
                to="/login"
                className="mobile-login-btn"
                onClick={closeMobileMenu}
              >
                Login
              </Link>

              <Link
                to="/register"
                className="mobile-signup-btn"
                onClick={closeMobileMenu}
              >
                Get Started
              </Link>

            </div>
          )}

        </div>
      )}

    </nav>
  );
};

export default Navbar;
