import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";
import logo from "../assets/logo.png";

// Dynamic navigation component with role-based routing and session management
const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Real-time user role tracking for personalized navigation
  const [role, setRole] = useState(localStorage.getItem("role"));

  // Session state synchronization with localStorage changes
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  // Secure logout functionality with complete session cleanup
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRole(null);
    navigate("/");
  };

  // Smart navigation configuration based on current route context
  const homeOnlyRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const showHomeButton = homeOnlyRoutes.includes(location.pathname);

  // Conditional UI rendering for authenticated vs public pages
  const showProfileAndLogout =
    !homeOnlyRoutes.includes(location.pathname) && location.pathname !== "/";

  return (
    <nav className={styles.navBar}>
      {/* Professional branding with logo integration */}
      <div className={styles.logo}>
        <img src={logo} alt="Fortitask Logo" className={styles.navLogo} />
        <Link to="/">Fortitask</Link>
      </div>
      
      {/* Dynamic navigation links based on user context and authentication */}
      <ul className={styles.navLinks}>
        {/* Home navigation for public pages */}
        {showHomeButton && (
          <li>
            <button className={styles.homeBtn} onClick={() => navigate("/")}>
              Home
            </button>
          </li>
        )}
        
        {/* Role-based profile navigation and session controls */}
        {showProfileAndLogout && role && (
          <>
            <li>
              {/* Smart profile routing based on user role for personalized experience */}
              <Link
                to={role === "Teacher" ? "/teacher/profile" : "/student/profile"}
                className={styles.navLink}
              >
                Profile
              </Link>
            </li>
            <li>
              {/* Secure logout with session termination */}
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;