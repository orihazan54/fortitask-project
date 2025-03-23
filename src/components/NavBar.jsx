
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";
import logo from "../assets/logo.png";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(localStorage.getItem("role"));

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRole(null);
    navigate("/");
  };

  const homeOnlyRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const showHomeButton = homeOnlyRoutes.includes(location.pathname);

  const showProfileAndLogout =
    !homeOnlyRoutes.includes(location.pathname) && location.pathname !== "/";

  return (
    <nav className={styles.navBar}>
      <div className={styles.logo}>
        <img src={logo} alt="Fortitask Logo" className={styles.navLogo} />
        <Link to="/">Fortitask</Link>
      </div>
      <ul className={styles.navLinks}>
        {showHomeButton && (
          <li>
            <button className={styles.homeBtn} onClick={() => navigate("/")}>
              Home
            </button>
          </li>
        )}
        {showProfileAndLogout && role && (
          <>
            <li>
              <Link
                to={role === "Teacher" ? "/teacher/profile" : "/student/profile"}
                className={styles.navLink}
              >
                Profile
              </Link>
            </li>
            <li>
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