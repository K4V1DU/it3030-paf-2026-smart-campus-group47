import { useState } from "react";
import styles from "./AdminNavbar.module.css";

// Helper to join class names cleanly
const cls = (...classes) => classes.filter(Boolean).join(" ");

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPath = window.location.pathname;

  const isActive = (href) => currentPath === href || currentPath.startsWith(href);

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <div className={styles.navBrand}>
          <div className={styles.navLogo}>SC</div>
          <span className={styles.navBrandName}>SmartCampus</span>
        </div>

        <div className={styles.navLinks}>
          <a href="/ResourceManagement" className={cls(styles.navLink, isActive("/ResourceManagement") && styles.navLinkActive)}>
            Resource Management
          </a>
          <a href="/BookingReviews" className={cls(styles.navLink, isActive("/BookingReviews") && styles.navLinkActive)}>
            Booking Reviews
          </a>
           <a href="/Admin/Tickets" className={cls(styles.navLink, isActive("/Admin/Tickets") && styles.navLinkActive)}>
            Tickets Management
          </a>
        
        </div>

        <div className={styles.navActions}>
          <button className={styles.loginBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Login
          </button>
          <button className={styles.profileBtn} title="Profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
          <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <a href="/resourcelist" className={cls(styles.mobileLink, isActive("/resourcelist") && styles.mobileLinkActive)}>Resources</a>
          <a href="/Booking"      className={cls(styles.mobileLink, isActive("/Booking") && styles.mobileLinkActive)}>Bookings</a>
          <a href="/ticket"       className={cls(styles.mobileLink, isActive("/ticket") && styles.mobileLinkActive)}>Tickets</a>
          <a href="#"             className={styles.mobileLink}>Login</a>
        </div>
      )}
    </nav>
  );
}