import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TechnicianNavBar.module.css";

const cls = (...classes) => classes.filter(Boolean).join(" ");

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    setProfileDropdown(false);
  };

  const getProfileImage = () => {
    if (user?.imageUrl) {
      return `http://localhost:8080/${user.imageUrl}`;
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='8' r='4' fill='%2393c5fd'/%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' stroke='%2364748b' stroke-width='2'/%3E%3C/svg%3E";
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <div className={styles.navBrand}>
          <div className={styles.navLogo}>SC</div>
          <span className={styles.navBrandName}>SmartCampus</span>
        </div>

        <div className={styles.navActions}>
          {user ? (
            <div className={styles.profileSection}>
              <div className={styles.profileDropdown}>
                <button
                  className={styles.profileBtn}
                  onClick={() => setProfileDropdown(!profileDropdown)}
                >
                  <img
                    src={getProfileImage()}
                    alt="Profile"
                    className={styles.profileImage}
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='8' r='4' fill='%2393c5fd'/%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' stroke='%2364748b' stroke-width='2'/%3E%3C/svg%3E";
                    }}
                  />
                  <span className={styles.profileName}>{user.name}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {profileDropdown && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownItem}>
                      <span className={styles.dropdownLabel}>Signed in as</span>
                      <span className={styles.dropdownValue}>{user.name}</span>
                    </div>
                    <div className={styles.dropdownItem}>
                      <span className={styles.dropdownLabel}>Role</span>
                      <span className={styles.dropdownValue}>{user.role}</span>
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <button className={styles.dropdownLogoutBtn} onClick={handleLogout}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <a href="/register" className={styles.loginBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}