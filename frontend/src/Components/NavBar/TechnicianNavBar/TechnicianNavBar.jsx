import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TechnicianNavBar.module.css";

const cls = (...classes) => classes.filter(Boolean).join(" ");

const BASE_URL = "http://localhost:8080";

export default function Navbar() {
  const [user, setUser]                       = useState(null);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [menuOpen, setMenuOpen]               = useState(false);
  const [notifOpen, setNotifOpen]             = useState(false);
  const [notifications, setNotifications]     = useState([]);
  const [notifLoading, setNotifLoading]       = useState(false);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const navigate   = useNavigate();
  const currentPath = window.location.pathname;

  const isActive = (href) => currentPath === href || currentPath.startsWith(href);

  // ── Load user from localStorage ──────────────────────────────────
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); }
      catch (e) { console.error("Error parsing user data:", e); }
    }
  }, []);

  // ── Fetch + auto-poll every 3 seconds ───────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // ── Close dropdowns on outside click ────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res  = await fetch(`${BASE_URL}/Notification/getByUser/${user.id}`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`${BASE_URL}/Notification/markAsRead/${id}`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const handleNotifClick = (n) => {
    if (!n.read) handleMarkAsRead(n.id);
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => handleMarkAsRead(n.id)));
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`${BASE_URL}/Notification/deleteNotification/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error("Failed to delete notification:", e);
    }
  };

  const handleClearAll = async () => {
    if (!user?.id) return;
    try {
      await fetch(`${BASE_URL}/Notification/deleteAllByUser/${user.id}`, { method: "DELETE" });
      setNotifications([]);
    } catch (e) {
      console.error("Failed to clear notifications:", e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    setProfileDropdown(false);
  };

  const getProfileImage = () => {
    if (user?.imageUrl) return `${BASE_URL}/${user.imageUrl}`;
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='8' r='4' fill='%2393c5fd'/%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' stroke='%2364748b' stroke-width='2'/%3E%3C/svg%3E";
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)    return "just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const typeIcon = (type) => {
    const icons = {
      BOOKING:  "📅",
      EVENT:    "🎉",
      ALERT:    "⚠️",
      REMINDER: "🔔",
      SYSTEM:   "⚙️",
      GENERAL:  "💬",
    };
    return icons[type] || "💬";
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        {/* Brand */}
        <div className={styles.navBrand}>
          <div className={styles.navLogo}>SC</div>
          <span className={styles.navBrandName}>SmartCampus</span>
        </div>

        {/* Links */}
        <div className={styles.navLinks}>
          <a href="/resourcelist" className={cls(styles.navLink, isActive("/resourcelist") && styles.navLinkActive)}>Resources</a>
          <a href="/Booking"      className={cls(styles.navLink, isActive("/Booking")      && styles.navLinkActive)}>Bookings</a>
          <a href="/ticket"       className={cls(styles.navLink, isActive("/ticket")       && styles.navLinkActive)}>Tickets</a>
        </div>

        {/* Actions */}
        <div className={styles.navActions}>
          {user ? (
            <>
              {/* ── Bell Icon ── */}
              <div className={styles.notifWrapper} ref={notifRef}>
                <button
                  className={styles.notifBtn}
                  onClick={() => { setNotifOpen((o) => !o); setProfileDropdown(false); }}
                  aria-label="Notifications"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className={styles.notifBadge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
                  )}
                </button>

                {/* ── Notification Dropdown ── */}
                {notifOpen && (
                  <div className={styles.notifDropdown}>
                    <div className={styles.notifHeader}>
                      <div className={styles.notifTitleRow}>
                        <span className={styles.notifTitle}>Notifications</span>
                        {unreadCount > 0 && (
                          <span className={styles.notifHeaderBadge}>{unreadCount} new</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className={styles.notifList}>
                      {notifLoading ? (
                        <div className={styles.notifEmpty}>
                          <span className={styles.notifEmptyIcon}>⏳</span>
                          <span>Loading...</span>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className={styles.notifEmpty}>
                          <span className={styles.notifEmptyIcon}>🔕</span>
                          <span>No notifications yet</span>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cls(styles.notifItem, !n.read && styles.notifItemUnread)}
                            onClick={() => handleNotifClick(n)}
                          >
                            <span className={styles.notifTypeIcon}>{typeIcon(n.type)}</span>
                            <div className={styles.notifContent}>
                              <div className={styles.notifItemHeader}>
                                <span className={styles.notifItemTitle}>{n.title}</span>
                                {!n.read && <span className={styles.unreadDot} />}
                              </div>
                              <span className={styles.notifMessage}>{n.message}</span>
                              <span className={styles.notifTime}>{formatTime(n.createdAt)}</span>
                            </div>
                            <button
                              className={cls(styles.notifActionBtn, styles.notifDeleteBtn)}
                              onClick={(e) => handleDeleteNotification(e, n.id)}
                              title="Delete"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className={styles.notifFooter}>
                        <button className={styles.clearAllBtn} onClick={handleClearAll}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                          Clear all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Profile ── */}
              <div className={styles.profileSection} ref={profileRef}>
                <div className={styles.profileDropdown}>
                  <button
                    className={styles.profileBtn}
                    onClick={() => { setProfileDropdown((o) => !o); setNotifOpen(false); }}
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

              <button className={styles.hamburger} onClick={() => setMenuOpen((o) => !o)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </>
          ) : (
            <>
              <a href="/" className={styles.loginBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Login
              </a>
              <button className={styles.hamburger} onClick={() => setMenuOpen((o) => !o)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <a href="/resourcelist" className={cls(styles.mobileLink, isActive("/resourcelist") && styles.mobileLinkActive)}>Resources</a>
          <a href="/Booking"      className={cls(styles.mobileLink, isActive("/Booking")      && styles.mobileLinkActive)}>Bookings</a>
          <a href="/ticket"       className={cls(styles.mobileLink, isActive("/ticket")       && styles.mobileLinkActive)}>Tickets</a>
          {user ? (
            <button className={styles.mobileLogoutBtn} onClick={handleLogout}>Logout</button>
          ) : (
            <a href="/" className={styles.mobileLink}>Login</a>
          )}
        </div>
      )}
    </nav>
  );
}